/**
 * queueController.js — The live clinic queue (final-vet's Queue Management).
 * A visit joins the queue when the pet arrives and is checked in (Waiting); the vet calls it
 * in (Serving) and then completes the consultation (Completed). Each vet serves one visit at
 * a time. The public board shows only queue numbers and pet names, pet owners see their own
 * place in line, and vets get the full board with owner details to run the queue.
 * Every action answers with the refreshed board.
 */
import Appointment from '../models/Appointment.js';
import { APPOINTMENT_STATUS } from '../shared/constants.js';
import { getManilaToday } from '../shared/dateUtils.js';
import ApiError from '../utils/ApiError.js';
import { loadQueueBoard } from '../utils/queueBoard.js';

const { CONFIRMED, COMPLETED } = APPOINTMENT_STATUS;

// ---- Views ------------------------------------------------------------------------------

/** What anyone may see about a ticket: queue number and pet names, never the owner. */
const publicTicket = (ticket) => ({
  id: ticket.id,
  queueNumber: ticket.queueNumber,
  pets: ticket.pets.map(({ name, species }) => ({ name, species })),
  startTime: ticket.startTime,
  minutes: ticket.minutes,
  late: ticket.late,
  servedAt: ticket.servedAt,
  position: ticket.position ?? null,
  waitMinutes: ticket.waitMinutes ?? null,
});

const publicLane = (lane) => ({
  vet: lane.vet,
  status: lane.status,
  serving: lane.serving && publicTicket(lane.serving),
  waiting: lane.waiting.map(publicTicket),
  expectedCount: lane.expected.length,
  nextExpectedTime: lane.expected[0]?.startTime ?? null,
  doneCount: lane.done.length,
  waitMinutes: lane.waitMinutes,
});

/** A pet owner's own ticket, with how many visits are ahead of it. */
const ownerTicket = (ticket, lane) => ({
  ...publicTicket(ticket),
  reference: ticket.reference,
  stage: ticket.stage,
  endTime: ticket.endTime,
  checkedInAt: ticket.checkedInAt,
  completedAt: ticket.completedAt,
  vet: { id: lane.vet.id, name: lane.vet.name, photo: lane.vet.photo },
  ahead: ticket.position ? ticket.position - 1 + (lane.serving ? 1 : 0) : null,
});

/** GET /api/queue — the public board on the home page. */
export async function getPublicQueue(req, res) {
  const board = await loadQueueBoard();
  res.set('Cache-Control', 'no-store');
  res.json({ ...board, lanes: board.lanes.map(publicLane) });
}

/** GET /api/queue/mine (owner) — the owner's visits today and their place in line. */
export async function getMyQueue(req, res) {
  const board = await loadQueueBoard();
  const ownerId = String(req.user._id);
  const tickets = board.lanes
    .flatMap((lane) =>
      [lane.serving, ...lane.waiting, ...lane.expected, ...lane.done].filter((ticket) => ticket?.owner.id === ownerId).map((ticket) => ownerTicket(ticket, lane)),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  res.set('Cache-Control', 'no-store');
  res.json({ date: board.date, generatedAt: board.generatedAt, clinic: board.clinic, tickets });
}

/** GET /api/queue/manage (vet) — the full board with owner names and mobile numbers. */
export async function getManageQueue(req, res) {
  res.set('Cache-Control', 'no-store');
  res.json(await loadQueueBoard());
}

// ---- Actions (vet) ----------------------------------------------------------------------

/** The still-open appointments (one per pet) of a visit on today's queue. */
async function findOpenVisit(visitId) {
  const rows = await Appointment.find({ visitId: String(visitId), date: getManilaToday(), status: CONFIRMED }).populate('vet');
  if (!rows.length) throw new ApiError("That visit isn't open on today's queue anymore. The board has been refreshed.", 404);
  return rows;
}

const idsOf = (rows) => rows.map((a) => a._id);
const vetLabel = (vet) => (vet?.name ? `Dr. ${vet.name}` : 'The veterinarian');

/** PATCH /api/queue/:visitId/check-in — the pet has arrived: Expected → Waiting. */
export async function checkIn(req, res) {
  const rows = await findOpenVisit(req.params.visitId);
  if (rows.some((a) => a.checkedInAt)) throw new ApiError(`Queue ${rows[0].queueNumber} is already checked in.`, 409);
  await Appointment.updateMany({ _id: { $in: idsOf(rows) }, checkedInAt: null }, { $set: { checkedInAt: new Date() } });
  res.json(await loadQueueBoard());
}

/** PATCH /api/queue/:visitId/call — the vet calls the patient in: Waiting → Serving (one at a time per vet). */
export async function callIn(req, res) {
  const rows = await findOpenVisit(req.params.visitId);
  const [visit] = rows;
  if (rows.some((a) => a.servedAt)) throw new ApiError(`Queue ${visit.queueNumber} is already with the vet.`, 409);
  if (!rows.some((a) => a.checkedInAt)) throw new ApiError(`Check queue ${visit.queueNumber} in first — the patient hasn't arrived yet.`, 409);
  const busy = await Appointment.findOne({
    date: visit.date,
    vetId: visit.vetId,
    status: CONFIRMED,
    servedAt: { $ne: null },
    visitId: { $ne: visit.visitId },
  });
  if (busy) throw new ApiError(`${vetLabel(visit.vet)} is still with queue ${busy.queueNumber}. Complete that visit first.`, 409);
  await Appointment.updateMany({ _id: { $in: idsOf(rows) } }, { $set: { servedAt: new Date() } });
  res.json(await loadQueueBoard());
}

/** PATCH /api/queue/:visitId/complete — consultation finished: Serving → Completed. */
export async function completeVisit(req, res) {
  const rows = await findOpenVisit(req.params.visitId);
  if (!rows.some((a) => a.servedAt)) throw new ApiError(`Call queue ${rows[0].queueNumber} in before completing the visit.`, 409);
  await Appointment.updateMany({ _id: { $in: idsOf(rows) }, status: CONFIRMED }, { $set: { status: COMPLETED, completedAt: new Date() } });
  res.json(await loadQueueBoard());
}

/** PATCH /api/queue/:visitId/undo — one step back: Serving → Waiting, or Waiting → not checked in. */
export async function undoStep(req, res) {
  const rows = await findOpenVisit(req.params.visitId);
  let change = null;
  if (rows.some((a) => a.servedAt)) change = { servedAt: null };
  else if (rows.some((a) => a.checkedInAt)) change = { checkedInAt: null };
  if (!change) throw new ApiError(`Queue ${rows[0].queueNumber} isn't checked in yet, so there is nothing to undo.`, 409);
  await Appointment.updateMany({ _id: { $in: idsOf(rows) } }, { $set: change });
  res.json(await loadQueueBoard());
}
