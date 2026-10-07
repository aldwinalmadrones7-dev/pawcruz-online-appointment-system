/**
 * ApiError.js — An error with an HTTP status and (optionally) the form field it belongs to.
 * The error handler turns it into { message, field } — the same shape the React app expects.
 */
export default class ApiError extends Error {
  constructor(message, status = 400, field = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.field = field;
  }
}

/**
 * Throws a 400 for the first message from a shared validateX() result ({ field: message }).
 * Uses the same validators as the React forms, so both sides apply identical rules.
 */
export function assertValid(errors) {
  const [field, message] = Object.entries(errors)[0] ?? [];
  if (field) throw new ApiError(message, 400, field);
}
