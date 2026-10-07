/**
 * schedule.js — Clinic hours and the 10-minute consultation slot rules (same as final-vet):
 * PawCruz books Monday–Sunday, 9:00 AM–7:00 PM; the last slot is 6:50–7:00 PM.
 * Each pet takes one 10-minute slot; several pets in one visit get consecutive slots
 * with the same veterinarian, inside that vet's shift.
 * The Express API runs the same rules (server/src/shared/schedule.js) to validate bookings.
 */
import { getManilaNowMinutes, getManilaToday, getWeekday } from './dateUtils';

export const SLOT_MINUTES = 10;

/** Opening hours by weekday (0 = Sunday … 6 = Saturday). Set a day to null to close it. */
export const CLINIC_HOURS = {
  0: { open: '09:00', close: '19:00' },
  1: { open: '09:00', close: '19:00' },
  2: { open: '09:00', close: '19:00' },
  3: { open: '09:00', close: '19:00' },
  4: { open: '09:00', close: '19:00' },
  5: { open: '09:00', close: '19:00' },
  6: { open: '09:00', close: '19:00' },
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (total) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const addMinutesToTime = (time, minutes) => minutesToTime(timeToMinutes(time) + minutes);

/** True when two [start, end) minute ranges overlap. */
export const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

export const getClinicHours = (dateKey) => CLINIC_HOURS[getWeekday(dateKey)];

export const isClinicOpen = (dateKey) => Boolean(getClinicHours(dateKey));

/** True when the vet works that weekday (and the clinic is open). */
export const isVetOnDuty = (vet, dateKey) => isClinicOpen(dateKey) && Boolean(vet?.availableDays?.includes(getWeekday(dateKey)));

/** The vet's working window on a date, clipped to clinic hours (minutes), or null when off duty. */
export function getVetWindow(vet, dateKey) {
  if (!isVetOnDuty(vet, dateKey)) return null;
  const hours = getClinicHours(dateKey);
  const start = Math.max(timeToMinutes(vet.shiftStart), timeToMinutes(hours.open));
  const end = Math.min(timeToMinutes(vet.shiftEnd), timeToMinutes(hours.close));
  return start < end ? { start, end } : null;
}

/** Earliest bookable minute for a date: slots that already started today are in the past. */
export function getEarliestStart(dateKey) {
  const today = getManilaToday();
  if (dateKey < today) return Infinity;
  return dateKey === today ? getManilaNowMinutes() + 1 : -Infinity;
}

const overlapsAny = (start, end, ranges) =>
  ranges.some((range) => rangesOverlap(start, end, timeToMinutes(range.start), timeToMinutes(range.end)));

/**
 * Builds the availability of every vet on one date (the final-vet "slot map").
 * @param {object} options
 * @param {object[]} options.vets all veterinarians
 * @param {string} options.dateKey "YYYY-MM-DD"
 * @param {number} options.petCount pets in the visit (each needs one 10-minute slot, back to back)
 * @param {Record<string, {start: string, end: string}[]>} options.busyByVet booked ranges per vet
 * @param {{start: string, end: string}[]} options.petBusy existing bookings of the selected pets
 * @returns {{ vets: object[], slotMap: Record<string, string[]>, slots: object[] }}
 *   slotMap = free start times per on-duty vet; slots = every start time of the day with
 *   { time, end, available, reason: null|'past'|'booked'|'conflict', vetIds }.
 */
export function buildAvailability({ vets, dateKey, petCount = 1, busyByVet = {}, petBusy = [] }) {
  const length = Math.max(1, petCount) * SLOT_MINUTES;
  const earliest = getEarliestStart(dateKey);
  const onDuty = vets.filter((vet) => getVetWindow(vet, dateKey));
  const slotMap = {};
  const byTime = new Map(); // time -> { inShift: bool, vetIds: [], past, conflict }

  onDuty.forEach((vet) => {
    const window = getVetWindow(vet, dateKey);
    const busy = busyByVet[vet.id] ?? [];
    slotMap[vet.id] = [];
    for (let start = window.start; start + length <= window.end; start += SLOT_MINUTES) {
      const end = start + length;
      const time = minutesToTime(start);
      const entry = byTime.get(time) ?? { vetIds: [], past: start < earliest, conflict: overlapsAny(start, end, petBusy) };
      byTime.set(time, entry);
      if (entry.past || entry.conflict || overlapsAny(start, end, busy)) continue;
      slotMap[vet.id].push(time);
      entry.vetIds.push(vet.id);
    }
  });

  const slots = [...byTime.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, entry]) => {
      let reason = null;
      if (entry.past) reason = 'past';
      else if (entry.conflict) reason = 'conflict';
      else if (!entry.vetIds.length) reason = 'booked';
      return { time, end: addMinutesToTime(time, length), available: reason === null, reason, vetIds: entry.vetIds };
    });

  return { vets: onDuty, slotMap, slots };
}
