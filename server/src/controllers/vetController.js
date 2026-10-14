/**
 * vetController.js — Public vet listing/details, plus each veterinarian's own profile:
 * specialty, PRC license, bio, photo, working days and shift hours (the shift decides which
 * 10-minute slots owners can book). Vets join by creating a veterinarian account.
 */
import Vet from '../models/Vet.js';
import { validateVetProfile } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';

const text = (value) => String(value ?? '').trim();

/** Keeps only the fields a vet may edit on their own profile, with normalized types. */
function cleanVetProfile(data) {
  return {
    specialty: text(data.specialty),
    licenseNo: text(data.licenseNo).toUpperCase(),
    yearsExperience: Number(data.yearsExperience),
    availableDays: [...new Set((data.availableDays ?? []).map(Number))].sort((a, b) => a - b),
    shiftStart: text(data.shiftStart),
    shiftEnd: text(data.shiftEnd),
    photo: text(data.photo),
    bio: text(data.bio),
    education: text(data.education),
  };
}

async function findVet(id) {
  const vet = await Vet.findById(id);
  if (!vet) throw new ApiError('Veterinarian not found.', 404);
  return vet;
}

async function findOwnVet(user) {
  const vet = await Vet.findOne({ userId: user._id });
  if (!vet) throw new ApiError('Your veterinarian profile was not found. Please contact the clinic.', 404);
  return vet;
}

/** GET /api/vets — vets with at least one duty day (a new vet appears once they set a schedule). */
export async function getVets(req, res) {
  res.json(await Vet.find({ 'availableDays.0': { $exists: true } }).sort({ name: 1 }));
}

/** GET /api/vets/:id */
export async function getVetById(req, res) {
  res.json(await findVet(req.params.id));
}

/** GET /api/vets/me (vet) — the logged-in veterinarian's own profile. */
export async function getMyVet(req, res) {
  res.json(await findOwnVet(req.user));
}

/** PUT /api/vets/me (vet) — booked visits keep their times; new hours apply to new bookings. */
export async function updateMyVet(req, res) {
  const vet = await findOwnVet(req.user);
  assertValid(validateVetProfile(req.body));
  const fields = cleanVetProfile(req.body);
  if (await Vet.exists({ licenseNo: fields.licenseNo, _id: { $ne: vet._id } })) {
    throw new ApiError('This PRC license number is already registered.', 409, 'licenseNo');
  }
  Object.assign(vet, fields);
  await vet.save();
  res.json(vet);
}
