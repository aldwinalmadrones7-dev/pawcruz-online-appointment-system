/**
 * AuthLayout — Full-screen split card shared by Login and Register: a brand panel with
 * photo and sparkles on the left (hidden on small screens) and the form on the right.
 * It fills the viewport without page scrolling; a top bar links back home and toggles the theme.
 */
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { PawIcon, SparkleIcon } from '../../components/BrandIcons';
import BrandLogo from '../../components/BrandLogo';
import ImageWithFallback from '../../components/ImageWithFallback';
import ThemeToggle from '../../components/ThemeToggle';

const PERKS = ['Book for one pet or several at once', 'Real-time 10-minute slots, every day', 'A live queue: see who’s in line before you go'];

export default function AuthLayout({ title, subtitle, children, wide = false }) {
  return (
    <main id="main-content" className="auth-screen">
      <div className={`auth-card${wide ? ' is-wide' : ''}`}>
        <aside className="auth-visual" aria-hidden="true">
          <ImageWithFallback src="/images/clinic-interior.jpg" alt="" className="auth-visual-img" />
          <div className="auth-visual-overlay">
            <span className="auth-visual-mark">
              <PawIcon size={26} shine />
            </span>
            <h2>Compassionate care for every paw.</h2>
            <ul>
              {PERKS.map((perk) => (
                <li key={perk}>
                  <FiCheckCircle /> {perk}
                </li>
              ))}
            </ul>
          </div>
          <SparkleIcon size={26} className="auth-spark spark-1" />
          <SparkleIcon size={14} className="auth-spark spark-2" />
        </aside>
        <div className="auth-form">
          <div className="auth-topbar">
            <BrandLogo />
            <div className="auth-topbar-actions">
              <Link to="/" className="auth-home-link">
                <FiArrowLeft aria-hidden="true" /> <span>Home</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <div className="auth-form-body">
            <h1 className="auth-title">{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
