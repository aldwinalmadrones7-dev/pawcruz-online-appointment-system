/**
 * BrandIcons — The site's inline SVG motif: a friendly paw print and a sparkle.
 * Both use currentColor, so they take the text color of their parent.
 */

export function PawIcon({ size = 24, className = '', shine = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <ellipse cx="5.6" cy="10.4" rx="2.1" ry="2.6" transform="rotate(-18 5.6 10.4)" />
        <ellipse cx="9.4" cy="5.9" rx="2.2" ry="2.8" transform="rotate(-6 9.4 5.9)" />
        <ellipse cx="14.6" cy="5.9" rx="2.2" ry="2.8" transform="rotate(6 14.6 5.9)" />
        <ellipse cx="18.4" cy="10.4" rx="2.1" ry="2.6" transform="rotate(18 18.4 10.4)" />
        <path d="M12 11.2c-2.6 0-6.2 3.9-6.2 6.7 0 1.8 1.3 2.9 3.1 2.9 1.3 0 2.1-.7 3.1-.7s1.8.7 3.1.7c1.8 0 3.1-1.1 3.1-2.9 0-2.8-3.6-6.7-6.2-6.7Z" />
      </g>
      {shine && <path d="M9 16.4c.4-1.3 1.3-2.3 2.4-2.7" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

export function SparkleIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 0c.7 6.1 2.6 9.9 12 12-9.4 2.1-11.3 5.9-12 12-.7-6.1-2.6-9.9-12-12C9.4 9.9 11.3 6.1 12 0Z" />
    </svg>
  );
}
