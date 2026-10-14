/**
 * petService.js — Pets API: pet owners manage their own pets (add, edit, remove);
 * veterinarians can read any owner's pets (for walk-in bookings).
 */
import axiosClient from '../api/axiosClient';

/** GET /pets/mine — the logged-in owner's pets. */
export async function getMyPets() {
  const { data } = await axiosClient.get('/pets/mine');
  return data;
}

/** GET /pets?ownerId= (vet) */
export async function getPets({ ownerId } = {}) {
  const { data } = await axiosClient.get('/pets', { params: { ownerId } });
  return data;
}

/** GET /pets/:id/history — completed visits only, newest first, each with its medical record. */
export async function getPetHistory(id) {
  const { data } = await axiosClient.get(`/pets/${id}/history`);
  return data;
}

/** POST /pets — owners add pets to their own account. */
export async function createPet(pet) {
  const { data } = await axiosClient.post('/pets', pet);
  return data;
}

/** PUT /pets/:id */
export async function updatePet(id, pet) {
  const { data } = await axiosClient.put(`/pets/${id}`, pet);
  return data;
}

/** DELETE /pets/:id — blocked while the pet still has upcoming visits. */
export async function deletePet(id) {
  const { data } = await axiosClient.delete(`/pets/${id}`);
  return data;
}
