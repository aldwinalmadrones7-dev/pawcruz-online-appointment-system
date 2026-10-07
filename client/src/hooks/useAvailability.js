/**
 * useAvailability — Loads a date's availability (final-vet style "slot map"):
 * which vets are on duty, their free start times, and every time slot of the day.
 * Shared by the booking wizard, the rebook modal and the admin appointment form.
 */
import { getAvailability } from '../services/appointmentService';
import useAsync from './useAsync';

const EMPTY = { vets: [], slotMap: {}, slots: [], unscheduled: false };

export default function useAvailability({ date, petIds = [], excludeAppointmentId = null }) {
  const ready = Boolean(date);
  const { data, loading, error, reload } = useAsync(
    () => (ready ? getAvailability({ date, petIds, excludeAppointmentId }) : Promise.resolve(EMPTY)),
    [ready, date, petIds.join(','), excludeAppointmentId],
  );

  return { ...(data ?? EMPTY), loading: ready && loading, error: error?.message ?? null, reload };
}
