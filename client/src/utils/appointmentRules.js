/**
 * appointmentRules.js — Business rules shared by pages and the service layer
 * (same as final-vet): bookings are Confirmed right away, an upcoming visit can be
 * cancelled or rebooked, and the clinic marks visits Completed on or after the day.
 * On the visit day the pet joins the live queue: checked in → with the vet → completed.
 */
import { ACTIVE_STATUSES, APPOINTMENT_STATUS, BOOKING_WINDOW_DAYS, LATE_ARRIVAL_MINUTES, QUEUE_STAGE } from './constants';
import { addDaysToKey, getManilaToday, isDateTimePast, toManilaDateTime } from './dateUtils';

const { CONFIRMED, COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

/** Allowed status changes. */
export const STATUS_TRANSITIONS = {
  [CONFIRMED]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

export const canTransition = (from, to) => Boolean(STATUS_TRANSITIONS[from]?.includes(to));

export const isActive = (appointment) => ACTIVE_STATUSES.includes(appointment.status);

/** Confirmed and not started yet. */
export const isUpcoming = (appointment) => isActive(appointment) && !isDateTimePast(appointment.date, appointment.startTime);

/** A visit can move to another time until the pet has checked in at the clinic. */
export const canRebook = (appointment) => isUpcoming(appointment) && !appointment.checkedInAt;

/** Pet owners may cancel any upcoming visit that isn't already with the vet… */
export const canOwnerCancel = (appointment) => isUpcoming(appointment) && !appointment.servedAt;

/** …and rebook only their own upcoming online bookings (walk-ins are rebooked at the front desk). */
export const canOwnerRebook = (appointment) => canRebook(appointment) && appointment.source === 'Online';

/** Where one appointment is in the live queue on its day (null once cancelled). */
export function getQueueStage(appointment) {
  if (appointment.status === CANCELLED) return null;
  if (appointment.status === COMPLETED) return QUEUE_STAGE.DONE;
  if (appointment.servedAt) return QUEUE_STAGE.SERVING;
  if (appointment.checkedInAt) return QUEUE_STAGE.WAITING;
  return QUEUE_STAGE.EXPECTED;
}

/** "Waiting" or "Serving" while the visit is in today's live queue (checked in, not finished), otherwise null. */
export const getLiveQueueStage = (appointment) => (isActive(appointment) && appointment.checkedInAt ? getQueueStage(appointment) : null);

/** Checked in more than LATE_ARRIVAL_MINUTES after the booked time (final-vet's "Late Arrival"). */
export function isLateArrival(appointment) {
  if (!appointment.checkedInAt) return false;
  const booked = toManilaDateTime(appointment.date, appointment.startTime).getTime();
  return new Date(appointment.checkedInAt).getTime() > booked + LATE_ARRIVAL_MINUTES * 60 * 1000;
}

/** The clinic marks a confirmed visit completed on or after its date. */
export const canComplete = (appointment) => appointment.status === CONFIRMED && appointment.date <= getManilaToday();

export const compareByDateTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/** Last date pet owners can book (today + booking window). */
export const getLastBookableDate = () => addDaysToKey(getManilaToday(), BOOKING_WINDOW_DAYS);
