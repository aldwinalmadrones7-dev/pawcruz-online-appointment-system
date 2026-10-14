/**
 * serviceController.js — Clinic services (also the "reason for visit" list when booking):
 * public listing/details plus create, update and delete by veterinarians.
 */
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import { ACTIVE_STATUSES } from '../shared/constants.js';
import { getManilaToday, isDateTimePast } from '../shared/dateUtils.js';
import { validateService } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';

const text = (value) => String(value ?? '').trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Keeps only editable fields and normalizes their types. */
function cleanService(data) {
  return {
    name: text(data.name),
    category: text(data.category),
    price: Math.round(Number(data.price)),
    duration: Number(data.duration),
    description: text(data.description),
    image: text(data.image),
    featured: Boolean(data.featured),
  };
}

async function assertUniqueName(name, ignoreId = null) {
  const filter = { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } };
  if (ignoreId) filter._id = { $ne: ignoreId };
  if (await Service.exists(filter)) throw new ApiError('A service with this name already exists.', 409, 'name');
}

async function findService(id) {
  const service = await Service.findById(id);
  if (!service) throw new ApiError('Service not found.', 404);
  return service;
}

/** GET /api/services — in the order they were added (featured services first on the home page). */
export async function getServices(req, res) {
  res.json(await Service.find().sort({ createdAt: 1, _id: 1 }));
}

/** GET /api/services/:id */
export async function getServiceById(req, res) {
  res.json(await findService(req.params.id));
}

/** POST /api/services (vet) */
export async function createService(req, res) {
  assertValid(validateService(req.body));
  const fields = cleanService(req.body);
  await assertUniqueName(fields.name);
  res.status(201).json(await Service.create(fields));
}

/** PUT /api/services/:id (vet) — new prices apply to future bookings only. */
export async function updateService(req, res) {
  const service = await findService(req.params.id);
  assertValid(validateService(req.body));
  const fields = cleanService(req.body);
  await assertUniqueName(fields.name, service._id);
  Object.assign(service, fields);
  await service.save();
  res.json(service);
}

/** DELETE /api/services/:id (vet) — blocked while upcoming bookings use it as their reason for visit. */
export async function deleteService(req, res) {
  const service = await findService(req.params.id);
  const candidates = await Appointment.find({ serviceId: service._id, status: { $in: ACTIVE_STATUSES }, date: { $gte: getManilaToday() } }, 'date startTime').lean();
  const upcoming = candidates.filter((a) => !isDateTimePast(a.date, a.startTime)).length;
  if (upcoming) {
    throw new ApiError(`This service still has ${upcoming} upcoming appointment(s). Cancel or complete them first.`, 409);
  }
  await service.deleteOne();
  res.json({ id: String(service._id) });
}
