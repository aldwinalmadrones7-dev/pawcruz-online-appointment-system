/**
 * axiosClient.js — Pre-configured Axios instance for the PawCruz Express API.
 * The base URL comes from VITE_API_URL (default http://localhost:5000/api) and every
 * request carries "Authorization: Bearer <token>" when the user is logged in.
 */
import axios from 'axios';
import { SESSION_EXPIRED_EVENT, STORAGE_KEYS } from '../utils/constants';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach the JWT saved at login to every request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn API failures into plain Errors with the server's message (and the form field it belongs to).
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // A rejected token (expired, or the account was removed): clear the session so the app logs out.
    if (status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    let message = error.response?.data?.message;
    if (!message) {
      message = error.response
        ? 'Something went wrong. Please try again.'
        : "Can't reach the PawCruz server. Check that the API is running and try again.";
    }
    return Promise.reject(Object.assign(new Error(message), { status, field: error.response?.data?.field ?? null }));
  },
);

export default axiosClient;
