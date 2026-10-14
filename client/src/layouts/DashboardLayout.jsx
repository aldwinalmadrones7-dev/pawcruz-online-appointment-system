/**
 * DashboardLayout — Shell for the pet-owner portal, admin panel and vet portal: sidebar
 * (collapses to a drawer on mobile), top bar with theme toggle and user menu, and the page area.
 */
import { Suspense, useEffect, useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { FiGlobe, FiLogOut, FiMenu, FiPlus, FiUser } from 'react-icons/fi';
import { Link, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import Avatar from '../components/Avatar';
import BrandLogo from '../components/BrandLogo';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import useAuth from '../hooks/useAuth';
import { getAppointmentCounts } from '../services/appointmentService';
import { APPOINTMENTS_CHANGED_EVENT, ROLES } from '../utils/constants';
import { getManilaToday } from '../utils/dateUtils';
import { formatDateLong, getFullName } from '../utils/formatters';
import { DASHBOARD_NAV } from './navConfig';

/** Top-bar wording for each role. */
const PORTAL_TEXT = {
  [ROLES.OWNER]: { portal: 'Pet owner portal', role: 'Pet owner', logout: "You'll need to log in again to manage your pets' appointments." },
  [ROLES.ADMIN]: { portal: 'Admin panel', role: 'Clinic admin', logout: 'You will need to log in again to manage the clinic.' },
  [ROLES.VET]: { portal: 'Veterinarian portal', role: 'Veterinarian', logout: 'You will need to log in again to see your patients.' },
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [showNav, setShowNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [badges, setBadges] = useState({});
  const isOwner = user.role === ROLES.OWNER;
  const text = PORTAL_TEXT[user.role] ?? PORTAL_TEXT[ROLES.OWNER];
  const displayName = user.role === ROLES.VET ? `Dr. ${getFullName(user)}` : getFullName(user);

  // Sidebar badges (bookings to accept / visits to complete / upcoming visits), refreshed after every appointment change.
  useEffect(() => {
    let active = true;
    const loadCounts = () =>
      getAppointmentCounts()
        .then((counts) => active && setBadges(counts))
        .catch(() => {});
    loadCounts();
    window.addEventListener(APPOINTMENTS_CHANGED_EVENT, loadCounts);
    return () => {
      active = false;
      window.removeEventListener(APPOINTMENTS_CHANGED_EVENT, loadCounts);
    };
  }, []);

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    toast.info('You have been logged out. See you soon!');
  };

  return (
    <div className={`dash-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        items={DASHBOARD_NAV[user.role]}
        badges={badges}
        collapsed={collapsed}
        show={showNav}
        onHide={() => setShowNav(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onLogout={() => setConfirmLogout(true)}
      />

      <div className="dash-main">
        <header className="dash-topbar">
          <button type="button" className="topbar-menu d-lg-none" onClick={() => setShowNav(true)} aria-label="Open navigation">
            <FiMenu aria-hidden="true" />
          </button>
          <div className="topbar-brand d-lg-none">
            <BrandLogo compact />
          </div>
          <div className="topbar-context d-none d-lg-block">
            <span className="topbar-portal">{text.portal}</span>
            <span className="topbar-date">{formatDateLong(getManilaToday())}</span>
          </div>

          <div className="topbar-actions">
            {isOwner && (
              <Button as={Link} to="/owner/book" variant="cta" size="sm" className="d-none d-sm-inline-flex">
                <FiPlus aria-hidden="true" /> Book
              </Button>
            )}
            <ThemeToggle />
            <Dropdown align="end">
              <Dropdown.Toggle variant="ghost" className="user-chip" id="dash-user-menu">
                <Avatar name={getFullName(user)} size={34} />
                <span className="user-chip-text d-none d-md-flex">
                  <strong>{displayName}</strong>
                  <small>{text.role}</small>
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Header>
                  <strong className="d-block text-body">{displayName}</strong>
                  <small>{user.email}</small>
                </Dropdown.Header>
                {isOwner && (
                  <Dropdown.Item as={Link} to="/owner/profile">
                    <FiUser aria-hidden="true" /> My profile
                  </Dropdown.Item>
                )}
                <Dropdown.Item as={Link} to="/">
                  <FiGlobe aria-hidden="true" /> Visit website
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item as="button" className="text-danger" onClick={() => setConfirmLogout(true)}>
                  <FiLogOut aria-hidden="true" /> Log out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        <main id="main-content" className="dash-content">
          <Suspense fallback={<LoadingSpinner label="Loading page…" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ConfirmModal
        show={confirmLogout}
        title="Log out of PawCruz?"
        message={text.logout}
        confirmLabel="Yes, log out"
        icon={FiLogOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
