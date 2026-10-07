/**
 * BrandLogo — Light-blue paw badge with a sparkle plus the "PawCruz Veterinary Clinic" wordmark.
 */
import { Link } from 'react-router-dom';
import { PawIcon, SparkleIcon } from './BrandIcons';

export default function BrandLogo({ to = '/', compact = false, light = false, onClick }) {
  return (
    <Link to={to} className={`brand-logo${light ? ' is-light' : ''}`} onClick={onClick} aria-label="PawCruz Veterinary Clinic home">
      <span className="brand-mark" aria-hidden="true">
        <PawIcon size={22} shine />
        <SparkleIcon size={12} className="brand-spark" />
      </span>
      {!compact && (
        <span className="brand-text">
          <strong>PawCruz</strong>
          <small>Veterinary Clinic</small>
        </span>
      )}
    </Link>
  );
}
