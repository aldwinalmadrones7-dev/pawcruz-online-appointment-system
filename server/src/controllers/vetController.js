/**
 * vetController.js — Public vet listing/details plus admin create, update and delete
 * (profile, PRC license, working days and shift hours).
 */
import Appointment from '../models/Appointment.js';
import Vet from '../models/Vet.js';
import { ACTIVE_STATUSES } from '../shared/constants.js';
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

/** POST /api/vets (admin) */
export async function createVet(req, res) {
  assertValid(validateVet(req.body));
  const fields = cleanVet(req.body);
  await assertUnique(fields);
  res.status(201).json(await Vet.create(fields));
}

/** PUT /api/vets/:id (admin) — booked visits keep their times; new hours apply to new bookings. */
export async function updateVet(req, res) {
  const vet = await findVet(req.params.id);
  assertValid(validateVet(req.body));
  const fields = cleanVet(req.body);
  await assertUnique(fields, vet._id);
  Object.assign(vet, fields);
  await vet.save();
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
  res.json({ id: String(vet._id) });
}
