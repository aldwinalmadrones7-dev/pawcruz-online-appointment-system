/**
 * LoadingSpinner — Branded loading indicator: a paw inside a spinning blue ring.
 * Use `fullPage` for route-level loading (e.g. while checking the session).
 */
import { PawIcon } from './BrandIcons';

export default function LoadingSpinner({ label = 'Loading…', fullPage = false, compact = false }) {
  return (
    <div className={`loading-spinner${fullPage ? ' is-full' : ''}${compact ? ' is-compact' : ''}`} role="status" aria-live="polite">
      <span className="spinner-orb" aria-hidden="true">
        <span className="spinner-ring" />
        <PawIcon size={compact ? 16 : 22} />
      </span>
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}
