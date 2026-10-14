/**
 * appointmentController.js — Appointments API, modelled on final-vet:
 * availability per vet (10-minute slots), booking one or more pets into back-to-back
 * slots with one vet, queue numbers, cancel, rebook, edits, deletes and dashboard stats.
 * Workflow: owners book → Pending; the admin accepts → Confirmed (walk-ins start here);
 * the assigned vet writes the medical record → Completed, which is the pet's visit history.
 * Every write re-checks the slot right before saving, and the unique indexes on the
 * Appointment model stop two requests from taking the same slot.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { isAdmin, isVet } from '../middleware/auth.js';
import Appointment, { APPOINTMENT_POPULATE } from '../models/Appointment.js';
import Pet from '../models/Pet.js';
import Service from '../models/Service.js';
import Vet from '../models/Vet.js';
import { canTransition, compareByDateTime, getLastBookableDate } from '../shared/appointmentRules.js';
import { ACTIVE_STATUSES, APPOINTMENT_SOURCES, APPOINTMENT_STATUS, APPOINTMENT_STATUSES, MAX_PETS_PER_VISIT } from '../shared/constants.js';
import { getManilaToday, getWeekDateKeys, isDateTimePast } from '../shared/dateUtils.js';
import { addMinutesToTime, buildAvailability, getVetWindow, SLOT_MINUTES } from '../shared/schedule.js';
import { validateMedicalRecord } from '../shared/validators.js';
import ApiError, { assertValid } from '../utils/ApiError.js';

const { PENDING, CONFIRMED, COMPLETED, CANCELLED } = APPOINTMENT_STATUS;
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

/** final-vet queue numbers: online visits "E-001" per day; walk-ins "#901" (hour + order in that hour). */
async function nextQueueNumber(source, date, startTime, excludeId = null) {
  const hour = Number(startTime.slice(0, 2));
  const sameDay = await Appointment.find({ date, source }, 'visitId startTime').lean();
  const sameQueue = sameDay.filter((a) => String(a._id) !== idString(excludeId) && (source === 'Online' || Number(a.startTime.slice(0, 2)) === hour));
  const sequence = new Set(sameQueue.map((a) => a.visitId)).size + 1;
  return source === 'Online' ? `E-${String(sequence).padStart(3, '0')}` : `#${hour % 12 || 12}${String(sequence).padStart(2, '0')}`;
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
  if (!isAdmin(user) && ownerId !== String(user._id)) throw new ApiError('Pet not found.', 404, 'petIds');
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

/** True when the logged-in vet is the one assigned to this appointment. */
const isAssignedVet = (appointment, user) => isVet(user) && Boolean(user.vetId) && String(appointment.vetId) === String(user.vetId);

/**
 * Finds an appointment the user may access: admins see all, owners their own, and vets
 * the accepted visits assigned to them. Anything else looks "not found".
 */
async function findAccessible(id, user) {
  const appointment = mongoose.isValidObjectId(id) ? await Appointment.findById(id) : null;
  const allowed =
    appointment &&
    (isAdmin(user) ||
      (isVet(user) ? isAssignedVet(appointment, user) && appointment.status !== PENDING : String(appointment.ownerId) === String(user._id)));
  if (!allowed) throw new ApiError('Appointment not found.', 404);
  return appointment;
}

/** Medical-record fields from the vet's form, with numbers and blanks normalized. */
function cleanMedicalRecord(data) {
  const optionalNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
  return {
    weight: optionalNumber(data.weight),
    temperature: optionalNumber(data.temperature),
    diagnosis: text(data.diagnosis, 500),
    treatment: text(data.treatment, 1000),
    prescription: text(data.prescription, 500),
    followUpDate: text(data.followUpDate, 10),
    remarks: text(data.remarks, 500),
    recordedAt: new Date(),
  };
}

async function saveAndPopulate(appointment, changes) {
  Object.assign(appointment, changes);
  await appointment.save();
  await appointment.populate(APPOINTMENT_POPULATE);
  return appointment;
}

// ---- Reads ------------------------------------------------------------------------

/** GET /api/appointments (admin) — optional filters: status, date, vetId, ownerId, petId, source. */
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

/** GET /api/appointments/vet — the logged-in vet's accepted visits (Confirmed and Completed). */
export async function getVetAppointments(req, res) {
  if (!req.user.vetId) return res.json([]);
  const list = await Appointment.find({ vetId: req.user.vetId, status: { $in: [CONFIRMED, COMPLETED] } }).populate(APPOINTMENT_POPULATE);
  res.json(list.sort(newestFirst));
}

/**
 * GET /api/pets/:id/history — a pet's visit history: only completed visits, each with the
 * vet's medical record (cancelled and not-yet-done visits are not part of it).
 * Admins and vets can read any patient's history; owners only their own pets'.
 */
export async function getPetHistory(req, res) {
  const pet = mongoose.isValidObjectId(req.params.id) ? await Pet.findById(req.params.id) : null;
  if (!pet || (!isAdmin(req.user) && !isVet(req.user) && String(pet.ownerId) !== String(req.user._id))) {
    throw new ApiError('Pet not found.', 404);
  }
  const visits = await Appointment.find({ petId: pet._id, status: COMPLETED }).populate(APPOINTMENT_POPULATE);
  res.json(visits.sort(newestFirst));
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
 * Pet owners always book "Online"; admins register "Walk-In" bookings for an owner's pets.
 * → 201 { reference, queueNumber, appointments }
 */
export async function createAppointment(req, res) {
  const { petIds, vetId, date, startTime, serviceId, notes = '', source } = req.body;
  const { pets, ownerId } = await resolvePets(petIds, req.user);
  const service = await assertService(serviceId);
  const visitSource = isAdmin(req.user) && APPOINTMENT_SOURCES.includes(source) ? source : 'Online';
  // The front desk's own bookings are accepted on the spot; online requests wait for the clinic.
  const status = isAdmin(req.user) ? CONFIRMED : PENDING;
  await assertBookable({ date, startTime, vetId, petIds: pets.map((p) => String(p._id)) });

  const reference = await generateReference();
  const visitId = randomUUID();
  const queueNumber = await nextQueueNumber(visitSource, date, startTime);
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
      status,
      notes: text(notes, 500),
      price: service.price,
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

/**
 * PATCH /api/appointments/:id/rebook — new date, time and/or vet for one pet's upcoming visit.
 * When an owner rebooks, the new time goes back to Pending for the clinic to accept.
 */
export async function rescheduleAppointment(req, res) {
  const { date, startTime, vetId } = req.body;
  const appointment = await findAccessible(req.params.id, req.user);
  if (!isUpcomingActive(appointment)) throw new ApiError('Only upcoming pending or confirmed appointments can be rebooked.', 400);
  if (!isAdmin(req.user) && appointment.source !== 'Online') {
    throw new ApiError('Walk-in visits can only be rebooked at the front desk.', 403);
  }
  await assertBookable({ date, startTime, vetId, petIds: [String(appointment.petId)], excludeAppointmentId: appointment._id });
  res.json(
    await saveAndPopulate(appointment, {
      date,
      startTime,
      endTime: addMinutesToTime(startTime, SLOT_MINUTES),
      vetId,
      visitId: randomUUID(), // a rebooked pet leaves its old group visit
      queueNumber: await nextQueueNumber(appointment.source, date, startTime, appointment._id),
      status: isAdmin(req.user) ? appointment.status : PENDING,
    }),
  );
}

/** PATCH /api/appointments/:id/cancel */
export async function cancelAppointment(req, res) {
  const appointment = await findAccessible(req.params.id, req.user);
  if (!ACTIVE_STATUSES.includes(appointment.status)) throw new ApiError('This appointment can no longer be cancelled.', 400);
  if (!isAdmin(req.user) && isDateTimePast(appointment.date, appointment.startTime)) {
    throw new ApiError('Past appointments cannot be cancelled.', 400);
  }
  res.json(
    await saveAndPopulate(appointment, {
      status: CANCELLED,
      cancelReason: text(req.body.reason, 200),
      cancelledBy: isAdmin(req.user) ? 'clinic' : 'owner',
    }),
  );
}

/**
 * PATCH /api/appointments/:id/status (admin) — accept a pending booking (→ Confirmed, which
 * sends it to the vet) or cancel/decline. Only the vet completes a visit, with its record.
 */
export async function updateAppointmentStatus(req, res) {
  const status = String(req.body.status ?? '');
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError('Appointment not found.', 404);
  if (status === COMPLETED) throw new ApiError('Only the assigned veterinarian can complete a visit, by adding its medical record.', 400);
  if (!canTransition(appointment.status, status)) {
    throw new ApiError(`A ${appointment.status.toLowerCase()} appointment can't be changed to ${status.toLowerCase() || 'that status'}.`, 400);
  }
  if (status === CONFIRMED && appointment.date < getManilaToday()) {
    throw new ApiError('This booking is for a day that has already passed. Cancel or rebook it instead.', 400);
  }
  const changes = { status };
  if (status === CANCELLED) {
    changes.cancelReason = text(req.body.reason, 200) || 'Cancelled by the clinic';
    changes.cancelledBy = 'clinic';
  }
  res.json(await saveAndPopulate(appointment, changes));
}

/**
 * PATCH /api/appointments/:id/complete (vet) — the assigned vet saves the medical record and
 * completes a confirmed visit on or after its day. It then shows in the pet's visit history.
 */
export async function completeAppointment(req, res) {
  const appointment = await findAccessible(req.params.id, req.user);
  if (appointment.status !== CONFIRMED) throw new ApiError(`This visit is already ${appointment.status.toLowerCase()}.`, 400);
  if (appointment.date > getManilaToday()) throw new ApiError('Visits can only be completed on or after their date.', 400);
  assertValid(validateMedicalRecord(req.body));
  res.json(await saveAndPopulate(appointment, { status: COMPLETED, medicalRecord: cleanMedicalRecord(req.body) }));
}

/** PUT /api/appointments/:id (admin) — edit reason, notes, source, status and (for upcoming visits) the schedule. */
export async function updateAppointment(req, res) {
  const data = req.body;
  const current = await Appointment.findById(req.params.id);
  if (!current) throw new ApiError('Appointment not found.', 404);
  const service = await assertService(data.serviceId || current.serviceId);
  const status = data.status || current.status;
  if (!APPOINTMENT_STATUSES.includes(status)) throw new ApiError('Please choose a valid status.', 400, 'status');
  // Completing belongs to the vet (it needs a medical record), and a completed visit is part of the history.
  if (current.status === COMPLETED && status !== COMPLETED) {
    throw new ApiError("A completed visit is part of the pet's history and can't be reopened.", 400, 'status');
  }
  if (status === COMPLETED && current.status !== COMPLETED) throw new ApiError('Only the assigned veterinarian can complete a visit.', 400, 'status');
  const source = APPOINTMENT_SOURCES.includes(data.source) ? data.source : current.source;

  const next = {
    date: data.date || current.date,
    startTime: data.startTime || current.startTime,
    vetId: idString(data.vetId || current.vetId),
  };
  const scheduleChanged = next.date !== current.date || next.startTime !== current.startTime || next.vetId !== String(current.vetId);
  const reactivated = ACTIVE_STATUSES.includes(status) && !ACTIVE_STATUSES.includes(current.status);
  if (ACTIVE_STATUSES.includes(status) && (scheduleChanged || reactivated)) {
    await assertBookable({ ...next, petIds: [String(current.petId)], excludeAppointmentId: current._id });
  }

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
  res.json(await saveAndPopulate(current, changes));
}

/** DELETE /api/appointments/:id (admin) */
export async function deleteAppointment(req, res) {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError('Appointment not found.', 404);
  res.json({ id: String(deleted._id) });
}

// ---- Dashboard ----------------------------------------------------------------------

/** GET /api/appointments/stats (admin) — totals, today's schedule, vets on duty, this week per day. */
export async function getDashboardStats(req, res) {
  const today = getManilaToday();
  const monthPrefix = today.slice(0, 7);
  const week = getWeekDateKeys(today);
  const [totals, todays, upcomingCandidates, completedThisMonth, registeredPets, weekRows, vets] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.find({ date: today }).populate(APPOINTMENT_POPULATE),
    Appointment.find({ status: { $in: ACTIVE_STATUSES }, date: { $gte: today } }, 'date startTime status').lean(),
    Appointment.countDocuments({ status: COMPLETED, date: { $regex: `^${monthPrefix}` } }),
    Pet.countDocuments(),
    Appointment.aggregate([
      { $match: { date: { $in: week }, status: { $ne: CANCELLED } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]),
    loadVets(),
  ]);
  const countOf = (status) => totals.find((t) => t._id === status)?.count ?? 0;
  const todaysSorted = todays.sort(compareByDateTime);
  const upcoming = upcomingCandidates.filter((a) => !isDateTimePast(a.date, a.startTime));

  res.json({
    totals: {
      total: totals.reduce((sum, t) => sum + t.count, 0),
      pending: countOf(PENDING),
      confirmed: countOf(CONFIRMED),
      completed: countOf(COMPLETED),
      cancelled: countOf(CANCELLED),
    },
    today: todaysSorted,
    walkInsToday: todaysSorted.filter((a) => a.source === 'Walk-In').length,
    upcomingConfirmed: upcoming.filter((a) => a.status === CONFIRMED).length,
    pendingRequests: upcoming.filter((a) => a.status === PENDING).length,
    completedThisMonth,
    registeredPets,
    vetsOnDuty: vets
      .filter((vet) => getVetWindow(vet, today))
      .map((vet) => ({
        ...vet,
        appointmentsToday: todaysSorted.filter((a) => String(a.vetId) === vet.id && a.status !== CANCELLED).length,
      }))
      .sort((a, b) => a.shiftStart.localeCompare(b.shiftStart)),
    week: week.map((date) => ({ date, count: weekRows.find((row) => row._id === date)?.count ?? 0, isToday: date === today })),
  });
}

/**
 * GET /api/appointments/counts — small numbers for the sidebar badges:
 * admin → bookings waiting to be accepted; vet → accepted visits (today or earlier) still to
 * complete; owner → their upcoming visits.
 */
export async function getAppointmentCounts(req, res) {
  const today = getManilaToday();
  if (isVet(req.user)) {
    const toComplete = req.user.vetId ? await Appointment.countDocuments({ vetId: req.user.vetId, status: CONFIRMED, date: { $lte: today } }) : 0;
    return res.json({ toComplete });
  }
  const filter = isAdmin(req.user) ? { status: PENDING, date: { $gte: today } } : { status: { $in: ACTIVE_STATUSES }, date: { $gte: today }, ownerId: req.user._id };
  const upcoming = (await Appointment.find(filter, 'date startTime').lean()).filter((a) => !isDateTimePast(a.date, a.startTime));
  res.json(isAdmin(req.user) ? { pending: upcoming.length } : { upcoming: upcoming.length });
}
