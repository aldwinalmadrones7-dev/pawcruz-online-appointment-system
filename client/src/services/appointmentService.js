/**
 * appointmentService.js — Appointments API, modelled on final-vet:
 * availability per vet (10-minute slots), booking one or more pets into back-to-back
 * slots with one vet, queue numbers, cancel, rebook, admin status changes, edits,
 * deletes and dashboard stats. The Express API re-checks every booking before saving.
 */
import axiosClient from '../api/axiosClient';
import { APPOINTMENTS_CHANGED_EVENT } from '../utils/constants';

/** Lets sidebar badges and counters refresh after any change. */
const emitChange = () => window.dispatchEvent(new Event(APPOINTMENTS_CHANGED_EVENT));

/** Runs a write request, then tells the app that appointments changed. */
async function write(request) {
  const { data } = await request;
  emitChange();
  return data;
}

// ---- Reads ------------------------------------------------------------------------

/** GET /appointments (admin) — optional filters: status, date, vetId, ownerId, petId, source. */
export async function getAppointments(filters = {}) {
  const { data } = await axiosClient.get('/appointments', { params: filters });
  return data;
}

/** GET /appointments/mine — the logged-in pet owner's appointments. */
export async function getMyAppointments() {
  const { data } = await axiosClient.get('/appointments/mine');
  return data;
}

/** GET /appointments/:id */
export async function getAppointmentById(id) {
  const { data } = await axiosClient.get(`/appointments/${id}`);
  return data;
}

/**
 * GET /appointments/availability?date=&petIds=&excludeId=
 * Returns { vets (on duty), slotMap: { vetId: [free start times] }, slots: [{ time, available, reason, vetIds }], unscheduled }.
 */
export async function getAvailability({ date, petIds = [], excludeAppointmentId = null }) {
  const params = { date, petIds: petIds.join(',') || undefined, excludeId: excludeAppointmentId || undefined };
  const { data } = await axiosClient.get('/appointments/availability', { params });
  return data;
}

// ---- Writes -----------------------------------------------------------------------

/**
 * POST /appointments — books one or more pets into back-to-back 10-minute slots with one vet.
 * Pet owners always book "Online"; admins register "Walk-In" bookings for an owner's pets.
 * Returns { reference, queueNumber, appointments }.
 */
export function createAppointment(booking) {
  return write(axiosClient.post('/appointments', booking));
}

/** PATCH /appointments/:id/rebook — new date, time and/or vet for one pet's upcoming visit. */
export function rescheduleAppointment(id, { date, startTime, vetId }) {
  return write(axiosClient.patch(`/appointments/${id}/rebook`, { date, startTime, vetId }));
}

/** PATCH /appointments/:id/cancel */
export function cancelAppointment(id, reason = '') {
  return write(axiosClient.patch(`/appointments/${id}/cancel`, { reason }));
}

/** PATCH /appointments/:id/status (admin) — mark completed or cancel. */
export function updateAppointmentStatus(id, status, reason = '') {
  return write(axiosClient.patch(`/appointments/${id}/status`, { status, reason }));
}

/** PUT /appointments/:id (admin) — edit reason, notes, source, status and (for upcoming visits) the schedule. */
export function updateAppointment(id, changes) {
  return write(axiosClient.put(`/appointments/${id}`, changes));
}

/** DELETE /appointments/:id (admin) */
export function deleteAppointment(id) {
  return write(axiosClient.delete(`/appointments/${id}`));
}

// ---- Dashboard ----------------------------------------------------------------------

/** GET /appointments/stats (admin) — totals, today's schedule, vets on duty, this week per day. */
export async function getDashboardStats() {
  const { data } = await axiosClient.get('/appointments/stats');
  return data;
}

/** GET /appointments/counts — small numbers for the sidebar badges. */
export async function getAppointmentCounts() {
  const { data } = await axiosClient.get('/appointments/counts');
  return data;
}
