/**
 * Sidebar — Dashboard navigation. A sticky column on desktop that can collapse to
 * an icon rail, and an off-canvas drawer on phones and tablets.
 */
import { Offcanvas } from 'react-bootstrap';
import { FiChevronLeft, FiChevronRight, FiGlobe, FiLogOut } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Sidebar({ items, badges = {}, collapsed, show, onHide, onToggleCollapse, onLogout }) {
  return (
    <aside className={`dash-sidebar${collapsed ? ' is-collapsed' : ''}`}>
      <Offcanvas show={show} onHide={onHide} responsive="lg" placement="start" className="sidebar-panel" aria-label="Dashboard navigation">
        <Offcanvas.Header closeButton closeVariant="white">
          <BrandLogo light onClick={onHide} />
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="sidebar-brand">
            <BrandLogo light compact={collapsed} />
            <button
              type="button"
              className="sidebar-collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <FiChevronRight aria-hidden="true" /> : <FiChevronLeft aria-hidden="true" />}
            </button>
          </div>

          <nav className="sidebar-nav" aria-label="Main">
            {items.map(({ to, label, icon: Icon, badgeKey }) => {
              const count = badgeKey ? badges[badgeKey] ?? 0 : 0;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onHide}
                  className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="sidebar-icon" aria-hidden="true" />
                  <span className="sidebar-label">{label}</span>
                  {count > 0 && (
                    <span className="sidebar-badge" aria-label={`${count} need attention`}>
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <Link to="/" className="sidebar-link" title={collapsed ? 'Visit website' : undefined}>
              <FiGlobe className="sidebar-icon" aria-hidden="true" />
              <span className="sidebar-label">Visit website</span>
            </Link>
            <button type="button" className="sidebar-link is-logout" onClick={onLogout} title={collapsed ? 'Log out' : undefined}>
              <FiLogOut className="sidebar-icon" aria-hidden="true" />
              <span className="sidebar-label">Log out</span>
            </button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </aside>
  );
}
