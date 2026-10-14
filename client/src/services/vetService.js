/**
 * vetService.js — Veterinarians API: the public listing and profiles, plus a logged-in vet's
 * own profile (specialty, PRC license, bio, duty days and shift hours — these drive the booking slots).
 */
import axiosClient from '../api/axiosClient';

/** GET /vets — vets with a schedule (new vets appear once they set their duty days). */
export async function getVets() {
  const { data } = await axiosClient.get('/vets');
  return data;
}

/** GET /vets/:id */
export async function getVetById(id) {
  const { data } = await axiosClient.get(`/vets/${id}`);
  return data;
}

/** GET /vets/me (vet) — my own vet profile. */
export async function getMyVetProfile() {
  const { data } = await axiosClient.get('/vets/me');
  return data;
}

/** PUT /vets/me (vet) — booked visits keep their times; new hours apply to new bookings. */
export async function updateMyVetProfile(profile) {
  const { data } = await axiosClient.put('/vets/me', profile);
  return data;
}
