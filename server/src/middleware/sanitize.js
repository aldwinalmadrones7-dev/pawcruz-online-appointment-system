/**
 * sanitize.js — Removes keys that start with "$" or contain "." from JSON bodies,
 * so values like { "email": { "$gt": "" } } can't turn into MongoDB operators (NoSQL injection).
 * Query strings are already safe: Express 5 parses them as plain strings.
 */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, inner]) => [key, clean(inner)]),
    );
  }
  return value;
}

export default function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
}
