/**
 * vetService.js — Veterinarians API: public listing/details plus admin create, update
 * and delete (profile, PRC license, working days and shift hours).
 */
import axiosClient from '../api/axiosClient';

/** GET /vets */
export async function getVets() {
  const { data } = await axiosClient.get('/vets');
  return data;
}

/** GET /vets/:id */
export async function getVetById(id) {
  const { data } = await axiosClient.get(`/vets/${id}`);
  return data;
}

/** POST /vets (admin) */
export async function createVet(vet) {
  const { data } = await axiosClient.post('/vets', vet);
  return data;
}

/** PUT /vets/:id (admin) — booked visits keep their times; new hours apply to new bookings. */
export async function updateVet(id, vet) {
  const { data } = await axiosClient.put(`/vets/${id}`, vet);
  return data;
}

/** DELETE /vets/:id (admin) — blocked while the vet still has upcoming visits. */
export async function deleteVet(id) {
  const { data } = await axiosClient.delete(`/vets/${id}`);
  return data;
}
