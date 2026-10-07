/**
 * auth.js — JWT middleware.
 *   protect      → requires "Authorization: Bearer <token>" and loads req.user (401 otherwise)
 *   authorize(…) → allows only the listed roles (403 otherwise)
 */
import User from '../models/User.js';
import { ROLES } from '../shared/constants.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';

const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

export async function protect(req, res, next) {
  const [scheme, token] = String(req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError('Please log in to continue.', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(SESSION_EXPIRED, 401);
  }

  // The account may have been deleted after the token was issued.
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(SESSION_EXPIRED, 401);
  req.user = user;
  next();
}

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) throw new ApiError('You are not authorized to perform this action.', 403);
    next();
  };

export const adminOnly = authorize(ROLES.ADMIN);
export const ownerOnly = authorize(ROLES.OWNER);

export const isAdmin = (user) => user?.role === ROLES.ADMIN;
