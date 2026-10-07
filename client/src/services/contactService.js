/**
 * contactService.js — Sends a message from the public Contact form (saved in MongoDB).
 */
import axiosClient from '../api/axiosClient';

/** POST /contact */
export async function sendContactMessage(message) {
  const { data } = await axiosClient.post('/contact', message);
  return data;
}
