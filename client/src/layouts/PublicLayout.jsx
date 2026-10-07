/**
 * PublicLayout — Navbar + page content + footer for the public site.
 * Renders the matched child route, or `children` when used as a wrapper (e.g. the 403 page).
 */
import { Outlet } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function PublicLayout({ children }) {
  return (
    <div className="public-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="public-main">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
