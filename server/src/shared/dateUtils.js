// Shared with the React app: same rules as client/src/utils/dateUtils.js — keep the two copies in sync.
/**
 * dateUtils.js — Date helpers pinned to the clinic timezone (Asia/Manila).
 * Appointment dates are stored as "YYYY-MM-DD" keys and times as "HH:mm",
 * so they never shift when the browser runs in a different timezone.
 */
import { addDays, format, parseISO, startOfWeek } from 'date-fns';

export const TIME_ZONE = 'Asia/Manila';
const MANILA_UTC_OFFSET = '+08:00'; // The Philippines has no daylight saving time.

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Today's calendar date in Manila, e.g. "2026-10-07". */
export function getManilaToday(now = new Date()) {
  return dateKeyFormatter.format(now);
}

/** Minutes since midnight right now in Manila (14:30 → 870). */
export function getManilaNowMinutes(now = new Date()) {
  const [hours, minutes] = clockFormatter.format(now).split(':').map(Number);
  return hours * 60 + minutes;
}

/** "YYYY-MM-DD" → local Date at midnight (for date-fns display and calendar math). */
export const parseDateKey = (key) => parseISO(key);

/** Date → "YYYY-MM-DD" using its local calendar parts. */
export const toDateKey = (date) => format(date, 'yyyy-MM-dd');

export const addDaysToKey = (key, days) => toDateKey(addDays(parseDateKey(key), days));

/** Day of the week for a date key (0 = Sunday … 6 = Saturday). */
export const getWeekday = (key) => parseDateKey(key).getDay();

/** The real moment a Manila wall-clock date/time happens (works in any browser timezone). */
export const toManilaDateTime = (key, time = '00:00') => new Date(`${key}T${time}:00${MANILA_UTC_OFFSET}`);

export const isDateTimePast = (key, time) => toManilaDateTime(key, time).getTime() <= Date.now();

/** The seven date keys (Monday → Sunday) of the week that contains `key`. */
export function getWeekDateKeys(key = getManilaToday()) {
  const monday = startOfWeek(parseDateKey(key), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(monday, index)));
}
