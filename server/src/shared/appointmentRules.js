// Shared with the React app: same rules as client/src/utils/appointmentRules.js — keep the two copies in sync.
/**
 * appointmentRules.js — Business rules shared by pages and the service layer:
 * online bookings start Pending until the clinic accepts them (walk-ins start Confirmed),
 * an upcoming visit can be cancelled or rebooked, and the assigned vet completes a
 * Confirmed visit on or after its day by writing the medical record.
 */
import { ACTIVE_STATUSES, APPOINTMENT_STATUS, BOOKING_WINDOW_DAYS } from './constants.js';
import { addDaysToKey, getManilaToday, isDateTimePast } from './dateUtils.js';

const { PENDING, CONFIRMED, COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

/** Allowed status changes. */
export const STATUS_TRANSITIONS = {
  [PENDING]: [CONFIRMED, CANCELLED],
  [CONFIRMED]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

export const canTransition = (from, to) => Boolean(STATUS_TRANSITIONS[from]?.includes(to));

export const isActive = (appointment) => ACTIVE_STATUSES.includes(appointment.status);

/** Pending or confirmed, and not started yet. */
export const isUpcoming = (appointment) => isActive(appointment) && !isDateTimePast(appointment.date, appointment.startTime);

/** Pet owners may cancel any upcoming visit… */
export const canOwnerCancel = isUpcoming;

/** …and rebook only their own upcoming online bookings (walk-ins are rebooked at the front desk). */
export const canOwnerRebook = (appointment) => isUpcoming(appointment) && appointment.source === 'Online';

/** The clinic accepts a pending booking any time before its day is over. */
export const canAccept = (appointment) => appointment.status === PENDING && appointment.date >= getManilaToday();

/** The assigned vet completes a confirmed visit (with its medical record) on or after its date. */
export const canComplete = (appointment) => appointment.status === CONFIRMED && appointment.date <= getManilaToday();

export const compareByDateTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/** Last date pet owners can book (today + booking window). */
export const getLastBookableDate = () => addDaysToKey(getManilaToday(), BOOKING_WINDOW_DAYS);
