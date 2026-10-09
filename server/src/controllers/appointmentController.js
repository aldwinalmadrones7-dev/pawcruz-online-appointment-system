/**
 * appointmentController.js — Appointments API, modelled on final-vet:
 * availability per vet (10-minute slots), booking one or more pets into back-to-back
 * slots with one vet, queue numbers, cancel, rebook, clinic (vet) status changes, edits,
 * deletes and dashboard stats. Every write re-checks the slot right before saving, and
 * the unique indexes on the Appointment model stop two requests from taking the same slot.
 * The live queue itself (check-in → with the vet → completed) is in queueController.js.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { isVet } from '../middleware/auth.js';
import Appointment, { APPOINTMENT_POPULATE } from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import Service from '../models/Service.js';
import Vet from '../models/Vet.js';
import { canTransition, compareByDateTime, getLastBookableDate } from '../shared/appointmentRules.js';
import { ACTIVE_STATUSES, APPOINTMENT_SOURCES, APPOINTMENT_STATUS, APPOINTMENT_STATUSES, MAX_PETS_PER_VISIT } from '../shared/constants.js';
import { getManilaToday, getWeekDateKeys, isDateTimePast } from '../shared/dateUtils.js';
import { addMinutesToTime, buildAvailability, getVetWindow, SLOT_MINUTES } from '../shared/schedule.js';
import ApiError from '../utils/ApiError.js';
import { loadQueueBoard } from '../utils/queueBoard.js';

const { CONFIRMED, COMPLETED, CANCELLED } = APPOINTMENT_STATUS;
const CHECKED_IN = "This pet is already checked in at the clinic, so the visit's time can't be changed now.";
/** Clears the live-queue progress (e.g. when a finished or cancelled visit is reopened). */
const QUEUE_RESET = { checkedInAt: null, servedAt: null, completedAt: null };
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I look-alikes
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const SLOT_ERRORS = {
  past: 'That time has already passed. Please pick a later slot.',
  booked: 'Sorry, that time was just taken. Please pick another slot.',
  conflict: 'One of your pets already has an appointment at that time.',
};

// ---- Helpers ----------------------------------------------------------------------

const text = (value, max) => String(value ?? '').trim().slice(0, max);
const idString = (value) => String(value ?? '');
const isUpcomingActive = (a) => ACTIVE_STATUSES.includes(a.status) && !isDateTimePast(a.date, a.startTime);
const newestFirst = (a, b) => compareByDateTime(b, a);
const toRange = (a) => ({ start: a.startTime, end: a.endTime });

/** Booking reference like "PWC-24X7Q" (crypto-random, checked for uniqueness). */
async function generateReference() {
  for (;;) {
    const reference = `PWC-${Array.from(randomBytes(5), (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('')}`;
    if (!(await Appointment.exists({ reference }))) return reference;
  }
}

/**
 * final-vet queue numbers: online visits "E-001" per day; walk-ins "#901" (hour + order in that hour).
 * The next number follows the highest one already given out, so a visit that was rebooked or
 * cancelled never frees its number for someone else (the live queue board must not show duplicates).
 */
async function nextQueueNumber(source, date, startTime, excludeId = null) {
  const hour = Number(startTime.slice(0, 2));
  const isOnline = source === 'Online';
  const digits = isOnline ? 3 : 2;
  const sameDay = await Appointment.find({ date, source }, 'queueNumber startTime').lean();
  const sameQueue = sameDay.filter((a) => String(a._id) !== idString(excludeId) && (isOnline || Number(a.startTime.slice(0, 2)) === hour));
  const sequence = Math.max(0, ...sameQueue.map((a) => Number(String(a.queueNumber).slice(-digits)) || 0)) + 1;
  return isOnline ? `E-${String(sequence).padStart(digits, '0')}` : `#${hour % 12 || 12}${String(sequence).padStart(digits, '0')}`;
}

/** Plain vet objects with string ids, as the shared schedule rules expect. */
const loadVets = async () => (await Vet.find().sort({ name: 1 })).map((vet) => vet.toJSON());

/** Builds the slot map for a date (see shared/schedule.buildAvailability). */
async function computeAvailability({ date, petIds = [], excludeAppointmentId = null }) {
  const vets = await loadVets();
  const sameDay = (await Appointment.find({ date, status: { $in: ACTIVE_STATUSES } }).lean()).filter(
    (a) => String(a._id) !== idString(excludeAppointmentId),
  );
  const busyByVet = {};
  sameDay.forEach((a) => {
    const vetId = String(a.vetId);
    busyByVet[vetId] = [...(busyByVet[vetId] ?? []), toRange(a)];
  });
  const result = buildAvailability({
    vets,
    dateKey: date,
    petCount: petIds.length || 1,
    busyByVet,
    petBusy: sameDay.filter((a) => petIds.includes(String(a.petId))).map(toRange),
  });
  return { ...result, unscheduled: result.vets.length === 0 };
}

/** Loads the pets for a booking and checks they exist, share one owner, and (for owners) are theirs. */
async function resolvePets(rawIds, user) {
  const ids = [...new Set((Array.isArray(rawIds) ? rawIds : [rawIds]).filter(Boolean).map(idString))];
  if (!ids.length) throw new ApiError('Please choose at least one pet.', 400, 'petIds');
  if (ids.length > MAX_PETS_PER_VISIT) throw new ApiError(`You can book up to ${MAX_PETS_PER_VISIT} pets in one visit.`, 400, 'petIds');
  if (!ids.every((id) => mongoose.isValidObjectId(id))) throw new ApiError('One of the selected pets no longer exists.', 404, 'petIds');
  const found = await Pet.find({ _id: { $in: ids } });
  const pets = ids.map((id) => found.find((p) => String(p._id) === id));
  if (pets.some((p) => !p)) throw new ApiError('One of the selected pets no longer exists.', 404, 'petIds');
  const ownerId = String(pets[0].ownerId);
  if (pets.some((p) => String(p.ownerId) !== ownerId)) throw new ApiError('All pets in one visit must belong to the same owner.', 400, 'petIds');
  if (!isVet(user) && ownerId !== String(user._id)) throw new ApiError('Pet not found.', 404, 'petIds');
  return { pets, ownerId };
}

/** Booking validation: date range, vet on duty and a free slot for every pet. */
async function assertBookable({ date, startTime, vetId, petIds, excludeAppointmentId = null }) {
  if (!DATE_KEY.test(String(date ?? '')) || date < getManilaToday()) throw new ApiError('Please choose today or a future date.', 400, 'date');
  if (date > getLastBookableDate()) throw new ApiError('Bookings open up to 60 days ahead. Please choose an earlier date.', 400, 'date');
  const vet = mongoose.isValidObjectId(vetId) ? await Vet.findById(vetId) : null;
  if (!vet) throw new ApiError('Please choose a veterinarian.', 404, 'vetId');
  if (!getVetWindow(vet, date)) throw new ApiError(`Dr. ${vet.name} isn't on duty that day.`, 400, 'vetId');

  const { slots, slotMap } = await computeAvailability({ date, petIds, excludeAppointmentId });
  const slot = slots.find((s) => s.time === startTime);
  if (!slot) throw new ApiError('Please choose one of the available times.', 400, 'startTime');
  if (!slot.available) throw new ApiError(SLOT_ERRORS[slot.reason], 409, 'startTime');
  if (!slotMap[String(vet._id)]?.includes(startTime)) {
    throw new ApiError(`Dr. ${vet.name} is no longer free at that time. Please choose another vet or time.`, 409, 'vetId');
  }
  return vet;
}

async function assertService(serviceId) {
  const service = mongoose.isValidObjectId(serviceId) ? await Service.findById(serviceId) : null;
  if (!service) throw new ApiError('Please choose the reason for the visit.', 400, 'serviceId');
  return service;
}

/** Finds an appointment the user may access. Other owners' records look "not found". */
async function findAccessible(id, user) {
  const appointment = await Appointment.findById(id);
  if (!appointment || (!isVet(user) && String(appointment.ownerId) !== String(user._id))) {
    throw new ApiError('Appointment not found.', 404);
  }
  return appointment;
}

async function saveAndPopulate(appointment, changes) {
  Object.assign(appointment, changes);
  await appointment.save();
  await appointment.populate(APPOINTMENT_POPULATE);
  return appointment;
}

// ---- Reads ------------------------------------------------------------------------

/** GET /api/appointments (vet) — optional filters: status, date, vetId, ownerId, petId, source. */
export async function getAppointments(req, res) {
  const filter = {};
  for (const key of ['status', 'date', 'source']) if (req.query[key]) filter[key] = String(req.query[key]);
  for (const key of ['vetId', 'ownerId', 'petId']) {
    if (!req.query[key]) continue;
    if (!mongoose.isValidObjectId(req.query[key])) return res.json([]);
    filter[key] = String(req.query[key]);
  }
  const list = await Appointment.find(filter).populate(APPOINTMENT_POPULATE);
  res.json(list.sort(newestFirst));
}

/** GET /api/appointments/mine — the logged-in pet owner's appointments. */
export async function getMyAppointments(req, res) {
  const list = await Appointment.find({ ownerId: req.user._id }).populate(APPOINTMENT_POPULATE);
  res.json(list.sort(newestFirst));
}

/** GET /api/appointments/:id */
export async function getAppointmentById(req, res) {
  const appointment = await findAccessible(req.params.id, req.user);
  res.json(await appointment.populate(APPOINTMENT_POPULATE));
}

/**
 * GET /api/appointments/availability?date=&petIds=a,b&excludeId=
 * → { vets (on duty), slotMap: { vetId: [free start times] }, slots: [{ time, available, reason, vetIds }], unscheduled }
 */
export async function getAvailability(req, res) {
  const petIds = String(req.query.petIds ?? '').split(',').filter(Boolean);
  const date = String(req.query.date ?? '');
  if (petIds.length) await resolvePets(petIds, req.user);
  if (!date) return res.json({ vets: [], slotMap: {}, slots: [], unscheduled: false });
  if (!DATE_KEY.test(date)) throw new ApiError('Please choose a valid date.', 400, 'date');
  res.json(await computeAvailability({ date, petIds, excludeAppointmentId: req.query.excludeId || null }));
}

// ---- Writes -----------------------------------------------------------------------

/**
 * POST /api/appointments — books one or more pets into back-to-back 10-minute slots with one vet.
 * Pet owners always book "Online"; vets register "Walk-In" bookings for an owner's pets and can
 * check a pet that is already at the clinic straight into today's live queue (checkIn: true).
 * → 201 { reference, queueNumber, appointments }
 */
export async function createAppointment(req, res) {
  const { petIds, vetId, date, startTime, serviceId, notes = '', source } = req.body;
  const { pets, ownerId } = await resolvePets(petIds, req.user);
  const service = await assertService(serviceId);
  const visitSource = isVet(req.user) && APPOINTMENT_SOURCES.includes(source) ? source : 'Online';
  await assertBookable({ date, startTime, vetId, petIds: pets.map((p) => String(p._id)) });

  const reference = await generateReference();
  const visitId = randomUUID();
  const queueNumber = await nextQueueNumber(visitSource, date, startTime);
  const checkedInAt = isVet(req.user) && req.body.checkIn === true && date === getManilaToday() ? new Date() : null;
  const rows = pets.map((pet, index) => {
    const petStart = addMinutesToTime(startTime, index * SLOT_MINUTES);
    return {
      reference,
      visitId,
      queueNumber,
      ownerId,
      petId: pet._id,
      vetId,
      serviceId: service._id,
      date,
      startTime: petStart,
      endTime: addMinutesToTime(petStart, SLOT_MINUTES),
      source: visitSource,
      status: CONFIRMED,
      notes: text(notes, 500),
      price: service.price,
      checkedInAt,
    };
  });

  let created;
  try {
    created = await Appointment.insertMany(rows);
  } catch (err) {
    // Another booking took one of the slots at the same moment: undo this visit's partial insert.
    await Appointment.deleteMany({ visitId });
    throw err;
  }
  const appointments = await Appointment.find({ _id: { $in: created.map((a) => a._id) } })
    .sort({ startTime: 1 })
    .populate(APPOINTMENT_POPULATE);
  res.status(201).json({ reference, queueNumber, appointments });
}

/** PATCH /api/appointments/:id/rebook — new date, time and/or vet for one pet's upcoming visit. */
export async function rescheduleAppointment(req, res) {
  const { date, startTime, vetId } = req.body;
  const appointment = await findAccessible(req.params.id, req.user);
  if (!isUpcomingActive(appointment)) throw new ApiError('Only upcoming confirmed appointments can be rebooked.', 400);
  if (!isVet(req.user) && appointment.source !== 'Online') {
    throw new ApiError('Walk-in visits can only be rebooked at the front desk.', 403);
  }
  if (appointment.checkedInAt) throw new ApiError(CHECKED_IN, 409);
  await assertBookable({ date, startTime, vetId, petIds: [String(appointment.petId)], excludeAppointmentId: appointment._id });
  res.json(
    await saveAndPopulate(appointment, {
      date,
      startTime,
      endTime: addMinutesToTime(startTime, SLOT_MINUTES),
      vetId,
      visitId: randomUUID(), // a rebooked pet leaves its old group visit
      queueNumber: await nextQueueNumber(appointment.source, date, startTime, appointment._id),
    }),
  );
}

/** PATCH /api/appointments/:id/cancel */
export async function cancelAppointment(req, res) {
  const appointment = await findAccessible(req.params.id, req.user);
  if (!ACTIVE_STATUSES.includes(appointment.status)) throw new ApiError('This appointment can no longer be cancelled.', 400);
  if (!isVet(req.user) && isDateTimePast(appointment.date, appointment.startTime)) {
    throw new ApiError('Past appointments cannot be cancelled.', 400);
  }
  if (!isVet(req.user) && appointment.servedAt) {
    throw new ApiError("Your pet is already with the vet, so this visit can't be cancelled now.", 400);
  }
  res.json(
    await saveAndPopulate(appointment, {
      status: CANCELLED,
      cancelReason: text(req.body.reason, 200),
      cancelledBy: isVet(req.user) ? 'clinic' : 'owner',
    }),
  );
}

/** PATCH /api/appointments/:id/status (vet) — mark completed or cancel. */
export async function updateAppointmentStatus(req, res) {
  const status = String(req.body.status ?? '');
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError('Appointment not found.', 404);
  if (!canTransition(appointment.status, status)) {
    throw new ApiError(`A ${appointment.status.toLowerCase()} appointment can't be changed to ${status.toLowerCase() || 'that status'}.`, 400);
  }
  if (status === COMPLETED && appointment.date > getManilaToday()) {
    throw new ApiError('Visits can only be marked completed on or after their date.', 400);
  }
  const changes = { status };
  if (status === COMPLETED) changes.completedAt = new Date();
  if (status === CANCELLED) {
    changes.cancelReason = text(req.body.reason, 200) || 'Cancelled by the clinic';
    changes.cancelledBy = 'clinic';
  }
  res.json(await saveAndPopulate(appointment, changes));
}

/** PUT /api/appointments/:id (vet) — edit reason, notes, source, status and (for upcoming visits) the schedule. */
export async function updateAppointment(req, res) {
  const data = req.body;
  const current = await Appointment.findById(req.params.id);
  if (!current) throw new ApiError('Appointment not found.', 404);
  const service = await assertService(data.serviceId || current.serviceId);
  const status = data.status || current.status;
  if (!APPOINTMENT_STATUSES.includes(status)) throw new ApiError('Please choose a valid status.', 400, 'status');
  const source = APPOINTMENT_SOURCES.includes(data.source) ? data.source : current.source;

  const next = {
    date: data.date || current.date,
    startTime: data.startTime || current.startTime,
    vetId: idString(data.vetId || current.vetId),
  };
  const scheduleChanged = next.date !== current.date || next.startTime !== current.startTime || next.vetId !== String(current.vetId);
  const reactivated = ACTIVE_STATUSES.includes(status) && !ACTIVE_STATUSES.includes(current.status);
  if (scheduleChanged && !reactivated && current.checkedInAt && ACTIVE_STATUSES.includes(current.status)) throw new ApiError(CHECKED_IN, 409);
  if (ACTIVE_STATUSES.includes(status) && (scheduleChanged || reactivated)) {
    await assertBookable({ ...next, petIds: [String(current.petId)], excludeAppointmentId: current._id });
  }
  if (status === COMPLETED && next.date > getManilaToday()) throw new ApiError('Future visits cannot be marked completed.', 400, 'status');

  const changes = {
    ...next,
    endTime: addMinutesToTime(next.startTime, SLOT_MINUTES),
    serviceId: service._id,
    source,
    status,
    notes: text(data.notes ?? current.notes, 500),
  };
  if (String(service._id) !== String(current.serviceId)) changes.price = service.price;
  if (scheduleChanged || source !== current.source) {
    changes.visitId = randomUUID();
    changes.queueNumber = await nextQueueNumber(source, next.date, next.startTime, current._id);
  }
  if (status === CANCELLED) {
    changes.cancelledBy = current.cancelledBy || 'clinic';
    changes.cancelReason = current.cancelReason || 'Cancelled by the clinic';
  } else {
    changes.cancelledBy = '';
    changes.cancelReason = '';
  }
  // A reopened visit starts the live queue again; a newly completed one gets its finish time.
  if (reactivated) Object.assign(changes, QUEUE_RESET);
  else if (status === COMPLETED && current.status !== COMPLETED) changes.completedAt = new Date();
  res.json(await saveAndPopulate(current, changes));
}

/** DELETE /api/appointments/:id (vet) */
export async function deleteAppointment(req, res) {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError('Appointment not found.', 404);
  res.json({ id: String(deleted._id) });
}

// ---- Dashboard ----------------------------------------------------------------------

/** GET /api/appointments/stats (vet) — totals, today's schedule and queue, vets on duty, this week per day. */
export async function getDashboardStats(req, res) {
  const today = getManilaToday();
  const monthPrefix = today.slice(0, 7);
  const week = getWeekDateKeys(today);
  const [totals, todays, upcomingCandidates, completedThisMonth, registeredPets, weekRows, vets, board] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.find({ date: today }).populate(APPOINTMENT_POPULATE),
    Appointment.find({ status: CONFIRMED, date: { $gte: today } }, 'date startTime').lean(),
    Appointment.countDocuments({ status: COMPLETED, date: { $regex: `^${monthPrefix}` } }),
    Pet.countDocuments(),
    Appointment.aggregate([
      { $match: { date: { $in: week }, status: { $ne: CANCELLED } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]),
    loadVets(),
    loadQueueBoard(),
  ]);
  const countOf = (status) => totals.find((t) => t._id === status)?.count ?? 0;
  const todaysSorted = todays.sort(compareByDateTime);

  res.json({
    totals: {
      total: totals.reduce((sum, t) => sum + t.count, 0),
      confirmed: countOf(CONFIRMED),
      completed: countOf(COMPLETED),
      cancelled: countOf(CANCELLED),
    },
    today: todaysSorted,
    walkInsToday: todaysSorted.filter((a) => a.source === 'Walk-In').length,
    upcomingConfirmed: upcomingCandidates.filter((a) => !isDateTimePast(a.date, a.startTime)).length,
    completedThisMonth,
    registeredPets,
    queue: board.totals,
    vetsOnDuty: vets
      .filter((vet) => getVetWindow(vet, today))
      .map((vet) => ({
        ...vet,
        appointmentsToday: todaysSorted.filter((a) => String(a.vetId) === vet.id && a.status !== CANCELLED).length,
        waiting: board.lanes.find((lane) => lane.vet.id === vet.id)?.waiting.length ?? 0,
      }))
      .sort((a, b) => a.shiftStart.localeCompare(b.shiftStart)),
    week: week.map((date) => ({ date, count: weekRows.find((row) => row._id === date)?.count ?? 0, isToday: date === today })),
  });
}

/** GET /api/appointments/counts — small numbers for the sidebar badges (vets also get who is waiting in the queue). */
export async function getAppointmentCounts(req, res) {
  const today = getManilaToday();
  const filter = { status: { $in: ACTIVE_STATUSES }, date: { $gte: today } };
  if (!isVet(req.user)) filter.ownerId = req.user._id;
  const upcoming = (await Appointment.find(filter, 'date startTime').lean()).filter((a) => !isDateTimePast(a.date, a.startTime));
  if (!isVet(req.user)) return res.json({ upcoming: upcoming.length });
  const board = await loadQueueBoard();
  res.json({ today: upcoming.filter((a) => a.date === today).length, waiting: board.totals.waiting });
}
