/**
 * authService.js — Authentication API: login, register, logout, current user,
 * profile updates and password changes. Stores the JWT + user in localStorage;
 * api/axiosClient.js sends the token with every request.
 */
import axiosClient from '../api/axiosClient';
import { STORAGE_KEYS } from '../utils/constants';

function saveSession({ token, user }) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/** Reads the saved session (no network call). */
export function getStoredSession() {
  try {
    return {
      token: localStorage.getItem(STORAGE_KEYS.TOKEN),
      user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)),
    };
  } catch {
    return { token: null, user: null };
  }
}

/** POST /auth/login → { token, user } */
export async function login({ email, password }) {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  saveSession(data);
  return data;
}

/** POST /auth/register → { token, user }. role is "owner" or "vet" (vets also send licenseNo, specialty and clinicCode). */
export async function register(details) {
  const { data } = await axiosClient.post('/auth/register', details);
  saveSession(data);
  return data;
}

/** Clears the client session (JWTs are stateless, so the server has nothing to undo). */
export function logout() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/** GET /auth/me → user. Validates the stored token. */
export async function getCurrentUser() {
  const { data } = await axiosClient.get('/auth/me');
  saveUser(data);
  return data;
}

/** PUT /auth/me → updated user */
export async function updateProfile(updates) {
  const { data } = await axiosClient.put('/auth/me', updates);
  saveUser(data);
  return data;
}

/** PUT /auth/password */
export async function changePassword(passwords) {
  const { data } = await axiosClient.put('/auth/password', passwords);
  return data;
}
