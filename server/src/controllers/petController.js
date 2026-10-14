/**
 * petController.js — Pet owners manage their own pets (add, edit, remove);
 * admins can read any owner's pets (for walk-in bookings) and edit them.
 */
import mongoose from 'mongoose';
import { isAdmin } from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import { ACTIVE_STATUSES, ROLES } from '../shared/constants.js';
import { getManilaToday, isDateTimePast } from '../shared/dateUtils.js';
import { validatePet } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';

const text = (value, max) => String(value ?? '').trim().slice(0, max);

/** Keeps only editable fields; "Other" species/breed use the typed value. */
function cleanPet(data) {
  return {
    name: text(data.name, 30),
    species: data.species === 'Other' ? text(data.customSpecies, 40) : text(data.species, 40),
    breed: data.breed === 'Other' ? text(data.customBreed, 40) : text(data.breed, 40),
    sex: data.sex,
    birthDate: text(data.birthDate, 10),
    weight: data.weight === '' || data.weight === null || data.weight === undefined ? null : Math.round(Number(data.weight) * 100) / 100,
    color: text(data.color, 40),
    microchip: text(data.microchip, 20),
    notes: text(data.notes, 300),
  };
}

/** Pets the user may change: their own (owners) or any (admins). Others look "not found". */
async function findEditable(id, user) {
  const pet = await Pet.findById(id);
  if (!pet || (!isAdmin(user) && String(pet.ownerId) !== String(user._id))) throw new ApiError('Pet not found.', 404);
  return pet;
}

/** GET /api/pets/mine */
export async function getMyPets(req, res) {
  res.json(await Pet.find({ ownerId: req.user._id }).sort({ name: 1 }));
}

/** GET /api/pets?ownerId= (admin) */
export async function getPets(req, res) {
  const filter = {};
  if (req.query.ownerId) {
    if (!mongoose.isValidObjectId(req.query.ownerId)) return res.json([]);
    filter.ownerId = String(req.query.ownerId);
  }
  res.json(await Pet.find(filter).sort({ name: 1 }));
}

/** POST /api/pets — owners add pets to their own account. */
export async function createPet(req, res) {
  if (req.user.role !== ROLES.OWNER) throw new ApiError('Only pet owners can add pets here.', 403);
  assertValid(validatePet(req.body));
  const pet = await Pet.create({ ...cleanPet(req.body), ownerId: req.user._id });
  res.status(201).json(pet);
}

/** PUT /api/pets/:id */
export async function updatePet(req, res) {
  const pet = await findEditable(req.params.id, req.user);
  assertValid(validatePet(req.body));
  Object.assign(pet, cleanPet(req.body));
  await pet.save();
  res.json(pet);
}

/** DELETE /api/pets/:id — blocked while the pet still has upcoming visits. */
export async function deletePet(req, res) {
  const pet = await findEditable(req.params.id, req.user);
  const candidates = await Appointment.find({ petId: pet._id, status: { $in: ACTIVE_STATUSES }, date: { $gte: getManilaToday() } }, 'date startTime').lean();
  const upcoming = candidates.filter((a) => !isDateTimePast(a.date, a.startTime)).length;
  if (upcoming) throw new ApiError(`${pet.name} still has ${upcoming} upcoming appointment(s). Cancel them first.`, 409);
  await pet.deleteOne();
  res.json({ id: String(pet._id) });
}
