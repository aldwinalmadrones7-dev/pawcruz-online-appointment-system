/**
 * contactController.js — Saves messages from the public Contact form.
 */
import ContactMessage from '../models/ContactMessage.js';
import { validateContact } from '../shared/validators.js';
import { assertValid } from '../utils/ApiError.js';

const text = (value, max) => String(value ?? '').trim().slice(0, max);

/** POST /api/contact */
export async function sendContactMessage(req, res) {
  assertValid(validateContact(req.body));
  const message = await ContactMessage.create({
    name: text(req.body.name, 60),
    email: text(req.body.email, 120).toLowerCase(),
    phone: text(req.body.phone, 11),
    subject: text(req.body.subject, 80),
    message: text(req.body.message, 1000),
  });
  res.status(201).json({ received: true, name: message.name });
}

/** GET /api/contact (admin) — newest messages first. */
export async function getContactMessages(req, res) {
  res.json(await ContactMessage.find().sort({ createdAt: -1 }).limit(200));
}
