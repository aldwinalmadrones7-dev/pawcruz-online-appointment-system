/**
 * Navbar — Public site navigation with the dark-mode toggle. Guests see
 * "Log in" and "Book Now"; logged-in users get a menu that depends on their role.
 */
import { useState } from 'react';
import { Navbar as BsNavbar, Button, Container, Dropdown, Nav } from 'react-bootstrap';
import { FiCalendar, FiGrid, FiHeart, FiLogOut, FiUser } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import { getFullName } from '../utils/formatters';
import { getDashboardPath } from '../utils/routes';
import Avatar from './Avatar';
import BrandLogo from './BrandLogo';
import ConfirmModal from './ConfirmModal';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/vets', label: 'Veterinarians' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const isOwner = user?.role === ROLES.OWNER;
  const close = () => setExpanded(false);

  const handleLogout = () => {
    setConfirmLogout(false);
    logout();
    toast.info('You have been logged out. See you soon!');
  };

  return (
    <>
      <BsNavbar expand="lg" sticky="top" className="site-nav" expanded={expanded} onToggle={setExpanded}>
        <Container>
          <BrandLogo onClick={close} />

          <div className="nav-quick order-lg-last">
            <ThemeToggle />
            <BsNavbar.Toggle aria-controls="site-menu" aria-label="Toggle navigation" />
          </div>

          <BsNavbar.Collapse id="site-menu">
            <Nav className="site-links mx-lg-auto">
              {LINKS.map((link) => (
                <Nav.Link key={link.to} as={NavLink} to={link.to} end={link.end} onClick={close}>
                  {link.label}
                </Nav.Link>
              ))}
            </Nav>

            <div className="nav-actions">
              {isAuthenticated ? (
                <>
                  {isOwner && (
                    <Button as={Link} to="/owner/book" variant="cta" onClick={close}>
                      <FiCalendar aria-hidden="true" /> Book Now
                    </Button>
                  )}
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="ghost" className="user-chip" id="site-user-menu">
                      <Avatar name={getFullName(user)} size={32} />
                      <span className="user-chip-name">{user.firstName}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Header>
                        <strong className="d-block text-body">{getFullName(user)}</strong>
                        <small>{user.email}</small>
                      </Dropdown.Header>
                      <Dropdown.Item as={Link} to={getDashboardPath(user.role)} onClick={close}>
                        <FiGrid aria-hidden="true" /> {isOwner ? 'My dashboard' : 'Admin panel'}
                      </Dropdown.Item>
                      {isOwner && (
                        <>
                          <Dropdown.Item as={Link} to="/owner/appointments" onClick={close}>
                            <FiCalendar aria-hidden="true" /> My appointments
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} to="/owner/pets" onClick={close}>
                            <FiHeart aria-hidden="true" /> My pets
                          </Dropdown.Item>
                          <Dropdown.Item as={Link} to="/owner/profile" onClick={close}>
                            <FiUser aria-hidden="true" /> Profile
                          </Dropdown.Item>
                        </>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item as="button" className="text-danger" onClick={() => setConfirmLogout(true)}>
                        <FiLogOut aria-hidden="true" /> Log out
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" onClick={close}>
                    Log in
                  </Button>
                  <Button as={Link} to="/owner/book" variant="cta" onClick={close}>
                    <FiCalendar aria-hidden="true" /> Book Now
                  </Button>
                </>
              )}
            </div>
          </BsNavbar.Collapse>
        </Container>
      </BsNavbar>

      <ConfirmModal
        show={confirmLogout}
        title="Log out of PawCruz?"
        message="You'll need to log in again to book or manage your pets' appointments."
        confirmLabel="Yes, log out"
        icon={FiLogOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
