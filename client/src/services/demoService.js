/**
 * demoService.js — Restores the original demo data in MongoDB (handy before a presentation).
 * Admin-only; the server must have ALLOW_DEMO_RESET=true in server/.env.
 */
import axiosClient from '../api/axiosClient';
import { APPOINTMENTS_CHANGED_EVENT } from '../utils/constants';

/** POST /demo/reset (admin) */
export async function resetDemoData() {
  const { data } = await axiosClient.post('/demo/reset');
  window.dispatchEvent(new Event(APPOINTMENTS_CHANGED_EVENT));
  return data;
}
