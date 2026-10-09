/**
 * RoleRoute — Lets only the listed roles through (e.g. veterinarians for /vet/*).
 * Everyone else sees the "403 Not Authorized" page instead.
 */
import { Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import PublicLayout from '../layouts/PublicLayout';
import Forbidden from '../pages/public/Forbidden';

export default function RoleRoute({ allowedRoles, children }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return (
      <PublicLayout>
        <Forbidden />
      </PublicLayout>
    );
  }
  return children ?? <Outlet />;
}
