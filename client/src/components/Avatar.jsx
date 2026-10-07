/**
 * Avatar — Round profile picture, or the person's initials when there is no photo.
 */
import { getInitials } from '../utils/formatters';

export default function Avatar({ name = '', src, size = 40, className = '' }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (src) return <img src={src} alt={name} className={`avatar ${className}`.trim()} style={style} />;
  return (
    <span className={`avatar avatar-initials ${className}`.trim()} style={style} aria-hidden="true">
      {getInitials(name) || '?'}
    </span>
  );
}
