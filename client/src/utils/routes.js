/**
 * routes.js — Where to send users after login/registration, based on their role
 * (pet owners → /owner, veterinarians → /vet) and the protected page they originally tried to open.
 */
import { ROLES } from './constants';

const AREAS = { [ROLES.OWNER]: '/owner', [ROLES.VET]: '/vet' };

/** "/owner" or "/vet" — the portal that belongs to a role. */
export const getAreaPath = (role) => AREAS[role] ?? AREAS[ROLES.OWNER];

export const getDashboardPath = (role) => `${getAreaPath(role)}/dashboard`;

/**
 * Returns the remembered page when it belongs to the user's area (e.g. a pet owner
 * returning to /owner/book?vet=v3), otherwise their dashboard.
 */
export function getPostLoginPath(user, from) {
  const area = getAreaPath(user.role);
  if (from?.pathname?.startsWith(`${area}/`)) return `${from.pathname}${from.search ?? ''}`;
  return getDashboardPath(user.role);
}
