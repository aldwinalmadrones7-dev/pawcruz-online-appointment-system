/**
 * queueBoard.js — Builds today's live clinic queue from the appointments, following
 * final-vet's Queue Management: one ticket per visit (pets booked together share a queue
 * number), one lane per veterinarian, waiting tickets in booked-time order, and an
 * estimated wait of 10 minutes per pet ahead in the same lane.
 */
import Appointment, { APPOINTMENT_POPULATE } from '../models/Appointment.js';
import Vet from '../models/Vet.js';
import { getQueueStage, isLateArrival } from '../shared/appointmentRules.js';
import { APPOINTMENT_STATUS, QUEUE_STAGE } from '../shared/constants.js';
import { getManilaNowMinutes, getManilaToday } from '../shared/dateUtils.js';
import { getClinicHours, getVetWindow, SLOT_MINUTES, timeToMinutes } from '../shared/schedule.js';

const { EXPECTED, WAITING, SERVING, DONE } = QUEUE_STAGE;

/** The earliest (Math.min) or latest (Math.max) of some optional dates, or null. */
function pickDate(values, pick) {
  const times = values.filter(Boolean).map((value) => new Date(value).getTime());
  return times.length ? new Date(pick(...times)) : null;
}

/** One ticket for one visit; `rows` are the visit's appointments (one per pet) as plain objects. */
function toTicket(rows) {
  const visit = [...rows].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const [first] = visit;
  const stages = new Set(visit.map(getQueueStage));
  return {
    id: first.visitId,
    queueNumber: first.queueNumber,
    reference: first.reference,
    source: first.source,
    vetId: String(first.vetId),
    // A visit is as far along as its least-finished pet.
    stage: [SERVING, WAITING, EXPECTED].find((stage) => stages.has(stage)) ?? DONE,
    startTime: first.startTime,
    endTime: visit.at(-1).endTime,
    minutes: visit.length * SLOT_MINUTES,
    late: visit.some(isLateArrival),
    checkedInAt: pickDate(visit.map((a) => a.checkedInAt), Math.min),
    servedAt: pickDate(visit.map((a) => a.servedAt), Math.min),
    completedAt: pickDate(visit.map((a) => a.completedAt), Math.max),
    pets: visit.map((a) => ({ id: String(a.petId), name: a.pet.name, species: a.pet.species, breed: a.pet.breed })),
    reasons: [...new Set(visit.map((a) => a.service.name))],
    notes: visit.find((a) => a.notes)?.notes ?? '',
    owner: { id: String(first.ownerId), firstName: first.owner.firstName, lastName: first.owner.lastName, phone: first.owner.phone },
  };
}

/** Groups a day's appointments (plain objects with pet/owner/service) into visit tickets. Cancelled pets leave the queue. */
export function buildTickets(appointments) {
  const visits = new Map();
  appointments
    .filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED)
    .forEach((a) => visits.set(a.visitId, [...(visits.get(a.visitId) ?? []), a]));
  return [...visits.values()].map(toTicket);
}

/** The minute of the day a ticket queues from: its booked time, or its check-in time when it came late. */
const queueKey = (ticket) => (ticket.late && ticket.checkedInAt ? getManilaNowMinutes(ticket.checkedInAt) : timeToMinutes(ticket.startTime));

/**
 * Queue order (final-vet): patients go in booked-time order. A late arrival (checked in 15+
 * minutes after its slot) queues from the time it checked in, so it never jumps ahead of
 * patients who came on time. Ties go to whoever checked in first.
 */
const byQueueOrder = (a, b) => queueKey(a) - queueKey(b) || (a.checkedInAt ?? 0) - (b.checkedInAt ?? 0);

/** 'off' (not on duty today), 'later' (shift starts later), 'on' (on shift now) or 'ended'. */
function laneStatus(window, nowMinutes) {
  if (!window) return 'off';
  if (nowMinutes < window.start) return 'later';
  if (nowMinutes >= window.end) return 'ended';
  return 'on';
}

/**
 * One lane per vet on duty today (or with patients today). Each waiting ticket gets its
 * `position` in line and `waitMinutes`: 10 minutes for every pet ahead of it in the lane,
 * counting the visit being served. The lane's `waitMinutes` is what a new arrival would wait.
 */
export function buildLanes(tickets, vets, { date, nowMinutes }) {
  return vets
    .map((vet) => ({ vet, window: getVetWindow(vet, date), mine: tickets.filter((t) => t.vetId === vet.id) }))
    .filter(({ window, mine }) => window || mine.length)
    .map(({ vet, window, mine }) => {
      const serving = mine.filter((t) => t.stage === SERVING).sort((a, b) => a.servedAt - b.servedAt)[0] ?? null;
      let aheadMinutes = serving?.minutes ?? 0;
      const waiting = mine
        .filter((t) => t.stage === WAITING)
        .sort(byQueueOrder)
        .map((ticket, index) => {
          const placed = { ...ticket, position: index + 1, waitMinutes: aheadMinutes };
          aheadMinutes += ticket.minutes;
          return placed;
        });
      return {
        vet: { id: vet.id, name: vet.name, photo: vet.photo, specialty: vet.specialty, shiftStart: vet.shiftStart, shiftEnd: vet.shiftEnd },
        status: laneStatus(window, nowMinutes),
        serving,
        waiting,
        expected: mine.filter((t) => t.stage === EXPECTED).sort(byQueueOrder),
        done: mine.filter((t) => t.stage === DONE).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
        waitMinutes: aheadMinutes,
      };
    })
    .sort((a, b) => a.vet.shiftStart.localeCompare(b.vet.shiftStart) || a.vet.name.localeCompare(b.vet.name));
}

/** Whether the clinic is open today and right now. */
function clinicStatus(date, nowMinutes) {
  const hours = getClinicHours(date);
  if (!hours) return { openToday: false, isOpen: false, opensAt: null, closesAt: null };
  return {
    openToday: true,
    isOpen: nowMinutes >= timeToMinutes(hours.open) && nowMinutes < timeToMinutes(hours.close),
    opensAt: hours.open,
    closesAt: hours.close,
  };
}

/** Today's whole queue: { date, generatedAt, clinic, totals, lanes }. Lanes include owner details (staff view). */
export async function loadQueueBoard(now = new Date()) {
  const date = getManilaToday(now);
  const nowMinutes = getManilaNowMinutes(now);
  const [appointments, vets] = await Promise.all([
    Appointment.find({ date, status: { $ne: APPOINTMENT_STATUS.CANCELLED } }).populate(APPOINTMENT_POPULATE),
    Vet.find().sort({ name: 1 }),
  ]);
  const tickets = buildTickets(appointments.map((a) => a.toJSON()));
  const count = (stage) => tickets.filter((t) => t.stage === stage).length;
  return {
    date,
    generatedAt: now.toISOString(),
    clinic: clinicStatus(date, nowMinutes),
    totals: { waiting: count(WAITING), serving: count(SERVING), expected: count(EXPECTED), done: count(DONE) },
    lanes: buildLanes(
      tickets,
      vets.map((vet) => vet.toJSON()),
      { date, nowMinutes },
    ),
  };
}
