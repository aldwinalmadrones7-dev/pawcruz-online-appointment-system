/**
 * errorHandler.js — Turns every error into JSON { message, field } with the right status code.
 * Express 5 forwards errors thrown in async handlers here automatically.
 */
import env from '../config/env.js';
import { APPOINTMENT_STATUS } from '../shared/constants.js';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Friendly messages for MongoDB duplicate-key errors (unique indexes). */
function duplicateKeyMessage(err) {
  const index = err.message ?? '';
  if (index.includes('vet_slot_unique')) return { status: 409, field: 'startTime', message: 'Sorry, that time was just taken. Please pick another slot.' };
  if (index.includes('pet_slot_unique')) return { status: 409, field: 'startTime', message: 'One of your pets already has an appointment at that time.' };
  const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? null;
  const labels = { email: 'This email is already in use.', licenseNo: 'This PRC license number is already registered.', name: 'This name is already in use.' };
  return { status: 409, field, message: labels[field] ?? 'This record already exists.' };
}

// Express needs all four arguments (err, req, res, _next) to treat this as an error handler.
export function errorHandler(err, req, res, _next) {
  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let field = err.field ?? null;

  if (err.name === 'ValidationError') {
    // Mongoose schema validation: report the first invalid field.
    const first = Object.values(err.errors)[0];
    status = 400;
    field = first?.path ?? null;
    message = first?.kind === 'enum' && first.path === 'status' ? `Status must be one of: ${Object.values(APPOINTMENT_STATUS).join(', ')}.` : first?.message ?? message;
  } else if (err.name === 'CastError') {
    // A malformed id (e.g. /api/pets/abc) is treated like a missing record.
    status = 404;
    message = 'Record not found.';
    field = null;
  } else if (err.code === 11000) {
    ({ status, message, field } = duplicateKeyMessage(err));
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'The request is too large.';
  }

  if (status >= 500) {
    console.error(err);
    // Don't leak internal details in production.
    if (env.isProduction) message = 'Something went wrong on our side. Please try again.';
  }

  res.status(status).json({ message, field });
}
