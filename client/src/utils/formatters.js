/**
 * formatters.js — Display helpers: Philippine peso amounts, dates, times,
 * durations, names, pet ages and greetings.
 */
import { differenceInCalendarDays, format } from 'date-fns';
import { WEEKDAYS } from './constants';
import { getManilaNowMinutes, getManilaToday, parseDateKey, TIME_ZONE } from './dateUtils';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

/** 1200 → "₱1,200" */
export const formatCurrency = (amount) => pesoFormatter.format(Number(amount) || 0);

/** "2026-10-09" → "Oct 9, 2026" (any date-fns pattern can be passed). */
export const formatDate = (key, pattern = 'MMM d, yyyy') => (key ? format(parseDateKey(key), pattern) : '—');

/** "2026-10-09" → "Friday, October 9, 2026" */
export const formatDateLong = (key) => formatDate(key, 'EEEE, MMMM d, yyyy');

/** "2026-10-09" → "Fri, Oct 9" */
export const formatDateShort = (key) => formatDate(key, 'EEE, MMM d');

/** "14:30" → "2:30 PM" (plain string math — no timezone involved). */
export function formatTime(time) {
  if (!time) return '—';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`;

/** 90 → "1 hr 30 min" */
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr${hours > 1 ? 's' : ''}`;
}

const timestampFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** ISO timestamp → "Oct 7, 2026, 2:30 PM" in Manila time. */
export const formatTimestamp = (iso) => (iso ? timestampFormatter.format(new Date(iso)) : '—');

const isoDateFormatter = new Intl.DateTimeFormat('en-PH', { timeZone: TIME_ZONE, dateStyle: 'medium' });

/** ISO timestamp → "Oct 7, 2026" (date only, Manila time). */
export const formatIsoDate = (iso) => (iso ? isoDateFormatter.format(new Date(iso)) : '—');

/** "Today", "Tomorrow", "In 5 days", "3 days ago" relative to Manila's today. */
export function formatRelativeDay(key) {
  const diff = differenceInCalendarDays(parseDateKey(key), parseDateKey(getManilaToday()));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${Math.abs(diff)} days ago`;
}

/** [1, 3, 5] → "Mon, Wed, Fri" (Monday first). */
export const formatWeekdays = (days = []) => {
  if (days.length === 7) return 'Every day';
  return [...days]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((day) => WEEKDAYS[day].short)
    .join(', ');
};

export const getFullName = (person) => (person ? `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() : '');

export const formatVetName = (vet) => (vet?.name ? `Dr. ${vet.name}` : 'Unassigned veterinarian');

/** Vet working hours, e.g. "9:00 AM – 2:00 PM". */
export const formatShift = (vet) => (vet?.shiftStart ? formatTimeRange(vet.shiftStart, vet.shiftEnd) : '—');

/** "Juan Dela Cruz" → "JD" */
export const getInitials = (name = '') =>
  name
    .replace(/^Dr\.\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** Pet age from a "YYYY-MM-DD" birth date: "2 yrs, 3 mos", "5 mos", or "" when unknown. */
export function formatPetAge(birthDate) {
  if (!birthDate) return '';
  const birth = parseDateKey(birthDate);
  const today = parseDateKey(getManilaToday());
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 1) return 'Under 1 mo';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (rest) parts.push(`${rest} mo${rest > 1 ? 's' : ''}`);
  return parts.join(', ');
}

/** "Shih Tzu · Female · 2 yrs" style one-line pet description. */
export const describePet = (pet) =>
  pet ? [pet.breed || pet.species, pet.sex !== 'Unknown' ? pet.sex : '', formatPetAge(pet.birthDate)].filter(Boolean).join(' · ') : '';

/** Time-of-day greeting based on Manila time. */
export function getGreeting(minutes = getManilaNowMinutes()) {
  if (minutes < 12 * 60) return 'Good morning';
  if (minutes < 18 * 60) return 'Good afternoon';
  return 'Good evening';
}
