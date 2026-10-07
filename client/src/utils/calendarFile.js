/**
 * calendarFile.js — Builds and downloads an .ics file so pet owners can add a visit
 * to Google Calendar, Apple Calendar or Outlook.
 */
import { CLINIC_INFO } from './constants';
import { toManilaDateTime } from './dateUtils';
import { formatVetName } from './formatters';

const toIcsUtc = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const escapeIcs = (text = '') =>
  String(text).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Accepts one appointment or a whole multi-pet visit (array, same vet and day). */
export function downloadAppointmentIcs(visit) {
  const appointments = Array.isArray(visit) ? visit : [visit];
  const first = appointments[0];
  const last = appointments[appointments.length - 1];
  const petNames = appointments.map((appointment) => appointment.pet.name).join(', ');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawCruz Veterinary Clinic//Appointments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${first.id}@pawcruz.ph`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(toManilaDateTime(first.date, first.startTime))}`,
    `DTEND:${toIcsUtc(toManilaDateTime(last.date, last.endTime))}`,
    `SUMMARY:${escapeIcs(`Vet visit for ${petNames} · PawCruz`)}`,
    `DESCRIPTION:${escapeIcs(`Reference ${first.reference}, queue ${first.queueNumber}, with ${formatVetName(first.vet)}. Please arrive 10 minutes early.`)}`,
    `LOCATION:${escapeIcs(CLINIC_INFO.address)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${first.reference}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
