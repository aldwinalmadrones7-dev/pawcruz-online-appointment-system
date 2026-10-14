/**
 * routes.js — Where to send users after login/registration, based on their role
 * and the protected page they originally tried to open.
 */
import { ROLES } from './constants';

/** Each role's area of the app. */
const AREA_BY_ROLE = { [ROLES.ADMIN]: '/admin', [ROLES.VET]: '/vet', [ROLES.OWNER]: '/owner' };

const getArea = (role) => AREA_BY_ROLE[role] ?? '/owner';

export const getDashboardPath = (role) => `${getArea(role)}/dashboard`;

/**
 * Returns the remembered page when it belongs to the user's area (e.g. a pet owner
 * returning to /owner/book?vet=v3), otherwise their dashboard.
 */
export function getPostLoginPath(user, from) {
  const area = getArea(user.role);
  if (from?.pathname?.startsWith(area)) return `${from.pathname}${from.search ?? ''}`;
  return getDashboardPath(user.role);
}
