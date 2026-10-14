/**
 * navConfig.js — Sidebar links for each role. `badgeKey` matches a field from
 * appointmentService.getAppointmentCounts() and shows a count bubble.
 */
import { FiCalendar, FiClipboard, FiGrid, FiHeart, FiPlusCircle, FiUser, FiUsers } from 'react-icons/fi';
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
  [ROLES.VET]: [
    { to: '/vet/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/vet/queue', label: 'Live Queue', icon: FiUsers, badgeKey: 'waiting' },
    { to: '/vet/appointments', label: 'Appointments', icon: FiCalendar, badgeKey: 'today' },
    { to: '/vet/patients', label: 'Animal Patients', icon: LuPawPrint },
    { to: '/vet/services', label: 'Services', icon: FiClipboard },
    { to: '/vet/profile', label: 'My Profile', icon: FiUser },
  ],
};
