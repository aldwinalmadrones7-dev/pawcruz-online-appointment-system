/**
 * routes.js — Where to send users after login/registration, based on their role
 * and the protected page they originally tried to open.
 */
import { ROLES } from './constants';

export const getDashboardPath = (role) => (role === ROLES.ADMIN ? '/admin/dashboard' : '/owner/dashboard');

/**
 * Returns the remembered page when it belongs to the user's area (e.g. a pet owner
 * returning to /owner/book?vet=v3), otherwise their dashboard.
 */
export function getPostLoginPath(user, from) {
  const area = user.role === ROLES.ADMIN ? '/admin' : '/owner';
  if (from?.pathname?.startsWith(area)) return `${from.pathname}${from.search ?? ''}`;
  return getDashboardPath(user.role);
}
