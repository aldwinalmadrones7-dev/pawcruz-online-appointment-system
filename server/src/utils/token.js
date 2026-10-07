/**
 * token.js — Signs and verifies the JSON Web Tokens used for login sessions.
 * The token carries only the user id (sub) and role; it expires after JWT_EXPIRES_IN.
 */
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' });

/** Returns the payload, or throws when the token is invalid or expired. */
export const verifyToken = (token) => jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
