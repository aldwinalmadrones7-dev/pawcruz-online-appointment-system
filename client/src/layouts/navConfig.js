/**
 * navConfig.js — Sidebar links for each role. `badgeKey` matches a field from
 * appointmentService.getAppointmentCounts() and shows a count bubble.
 */
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiClipboard, FiGrid, FiHeart, FiPlusCircle, FiUser } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { ROLES } from '../utils/constants';

export const DASHBOARD_NAV = {
  [ROLES.OWNER]: [
    { to: '/owner/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/owner/pets', label: 'My Pets', icon: FiHeart },
    { to: '/owner/book', label: 'Book Appointment', icon: FiPlusCircle },
    { to: '/owner/appointments', label: 'Appointments', icon: FiCalendar, badgeKey: 'upcoming' },
    { to: '/owner/profile', label: 'Profile', icon: FiUser },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/admin/appointments', label: 'Appointments', icon: FiCalendar, badgeKey: 'today' },
    { to: '/admin/patients', label: 'Animal Patients', icon: LuPawPrint },
    { to: '/admin/vets', label: 'Veterinarians', icon: FaUserMd },
    { to: '/admin/services', label: 'Services', icon: FiClipboard },
  ],
};
