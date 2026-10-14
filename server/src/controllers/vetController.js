/**
 * vetController.js — Public vet listing/details plus admin create, update and delete
 * (profile, PRC license, working days and shift hours). Every vet also has a login account
 * (role "vet", same email) so they can see their accepted visits and write medical records.
 */
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Vet from '../models/Vet.js';
import { ACTIVE_STATUSES, ROLES } from '../shared/constants.js';
import { getManilaToday, isDateTimePast } from '../shared/dateUtils.js';
import { validateVet } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';

const text = (value) => String(value ?? '').trim();

/** Keeps only editable fields and normalizes their types. */
function cleanVet(data) {
  return {
    name: text(data.name).replace(/^Dr\.?\s+/i, ''),
    specialty: text(data.specialty),
    licenseNo: text(data.licenseNo).toUpperCase(),
    email: text(data.email).toLowerCase(),
    phone: text(data.phone),
    yearsExperience: Number(data.yearsExperience),
    availableDays: [...new Set((data.availableDays ?? []).map(Number))].sort((a, b) => a - b),
    shiftStart: text(data.shiftStart),
    shiftEnd: text(data.shiftEnd),
    photo: text(data.photo),
    bio: text(data.bio),
    education: text(data.education),
  };
}

async function assertUnique({ email, licenseNo }, ignoreId = null) {
  const others = ignoreId ? { _id: { $ne: ignoreId } } : {};
  if (await Vet.exists({ email, ...others })) throw new ApiError('Another veterinarian already uses this email.', 409, 'email');
  if (await Vet.exists({ licenseNo, ...others })) throw new ApiError('This PRC license number is already registered.', 409, 'licenseNo');
  // The email is also the vet's login, so no other account may use it.
  const otherAccounts = ignoreId ? { vetId: { $ne: ignoreId } } : {};
  if (await User.exists({ email, ...otherAccounts })) throw new ApiError('Another account already uses this email.', 409, 'email');
}

/** "Neil Norman A. Cruz" → { firstName: 'Neil Norman A.', lastName: 'Cruz' } for the login account. */
function splitName(name) {
  const parts = name.split(/\s+/);
  return parts.length > 1 ? { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) } : { firstName: name, lastName: name };
}

/** Creates or updates the vet's login account; a blank password keeps the current one. */
async function syncVetAccount(vet, password) {
  const account = (await User.findOne({ vetId: vet._id }).select('+password')) ?? new User({ role: ROLES.VET, vetId: vet._id });
  Object.assign(account, { ...splitName(vet.name), email: vet.email, phone: vet.phone });
  if (password) account.password = String(password); // hashed by the pre-save hook
  if (!account.password) return; // an older vet without a login, edited without setting one
  await account.save();
}

async function findVet(id) {
  const vet = await Vet.findById(id);
  if (!vet) throw new ApiError('Veterinarian not found.', 404);
  return vet;
}

/** GET /api/vets */
export async function getVets(req, res) {
  res.json(await Vet.find().sort({ name: 1 }));
}

/** GET /api/vets/:id */
export async function getVetById(req, res) {
  res.json(await findVet(req.params.id));
}

/** POST /api/vets (admin) — the vet's login uses their email and the password set here. */
export async function createVet(req, res) {
  assertValid(validateVet(req.body));
  const fields = cleanVet(req.body);
  await assertUnique(fields);
  const vet = await Vet.create(fields);
  try {
    await syncVetAccount(vet, req.body.password);
  } catch (err) {
    await vet.deleteOne(); // don't leave a vet who can't log in
    throw err;
  }
  res.status(201).json(vet);
}

/** PUT /api/vets/:id (admin) — booked visits keep their times; new hours apply to new bookings. */
export async function updateVet(req, res) {
  const vet = await findVet(req.params.id);
  assertValid(validateVet(req.body, { isEdit: true }));
  const fields = cleanVet(req.body);
  await assertUnique(fields, vet._id);
  Object.assign(vet, fields);
  await vet.save();
  await syncVetAccount(vet, req.body.password);
  res.json(vet);
}

/** DELETE /api/vets/:id (admin) — blocked while the vet still has upcoming visits. */
export async function deleteVet(req, res) {
  const vet = await findVet(req.params.id);
  const candidates = await Appointment.find({ vetId: vet._id, status: { $in: ACTIVE_STATUSES }, date: { $gte: getManilaToday() } }, 'date startTime').lean();
  const upcoming = candidates.filter((a) => !isDateTimePast(a.date, a.startTime)).length;
  if (upcoming) {
    throw new ApiError(`This veterinarian still has ${upcoming} upcoming appointment(s). Rebook or cancel them first.`, 409);
  }
  await vet.deleteOne();
  await User.deleteMany({ vetId: vet._id, role: ROLES.VET }); // their login goes too
  res.json({ id: String(vet._id) });
}
