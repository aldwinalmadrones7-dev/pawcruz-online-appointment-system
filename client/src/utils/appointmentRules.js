/**
 * appointmentRules.js — Business rules shared by pages and the service layer
 * (same as final-vet): bookings are Confirmed right away, an upcoming visit can be
 * cancelled or rebooked, and the clinic marks visits Completed on or after the day.
 */
import { ACTIVE_STATUSES, APPOINTMENT_STATUS, BOOKING_WINDOW_DAYS } from './constants';
import { addDaysToKey, getManilaToday, isDateTimePast } from './dateUtils';

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

/** Pet owners may cancel any upcoming visit… */
export const canOwnerCancel = isUpcoming;

/** …and rebook only their own upcoming online bookings (walk-ins are rebooked at the front desk). */
export const canOwnerRebook = (appointment) => isUpcoming(appointment) && appointment.source === 'Online';

/** The clinic marks a confirmed visit completed on or after its date. */
export const canComplete = (appointment) => appointment.status === CONFIRMED && appointment.date <= getManilaToday();

export const compareByDateTime = (a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);

/** Last date pet owners can book (today + booking window). */
export const getLastBookableDate = () => addDaysToKey(getManilaToday(), BOOKING_WINDOW_DAYS);
