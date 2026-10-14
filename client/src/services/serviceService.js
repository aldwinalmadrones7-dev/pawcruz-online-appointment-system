/**
 * serviceService.js — Clinic services API (also the "reason for visit" list when booking):
 * public listing/details plus create, update and delete by veterinarians.
 */
import axiosClient from '../api/axiosClient';

/** GET /services */
export async function getServices() {
  const { data } = await axiosClient.get('/services');
  return data;
}

/** GET /services/:id */
export async function getServiceById(id) {
  const { data } = await axiosClient.get(`/services/${id}`);
  return data;
}

/** POST /services (vet) */
export async function createService(service) {
  const { data } = await axiosClient.post('/services', service);
  return data;
}

/** PUT /services/:id (vet) — new prices apply to future bookings only. */
export async function updateService(id, service) {
  const { data } = await axiosClient.put(`/services/${id}`, service);
  return data;
}

/** DELETE /services/:id (vet) — blocked while upcoming bookings use it as their reason for visit. */
export async function deleteService(id) {
  const { data } = await axiosClient.delete(`/services/${id}`);
  return data;
}
