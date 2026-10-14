/**
 * patientService.js — Patient records for admins (read-only). In a vet clinic the
 * patients are the animals, so getPatients() returns every pet with its owner and a
 * quick visit summary; getOwners() lists pet-owner accounts (for walk-in bookings).
 */
import axiosClient from '../api/axiosClient';

/** GET /patients (admin) — animal patients with owner and visit stats. */
export async function getPatients() {
  const { data } = await axiosClient.get('/patients');
  return data;
}

/** GET /users?role=owner (admin) — pet-owner accounts with how many pets each has. */
export async function getOwners() {
  const { data } = await axiosClient.get('/users', { params: { role: 'owner' } });
  return data;
}
