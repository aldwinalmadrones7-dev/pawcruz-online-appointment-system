/**
 * SectionHeading — Eyebrow (with sparkle), title and subtitle used by landing sections.
 */
import { SparkleIcon } from './BrandIcons';

export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', as: Tag = 'h2', className = '' }) {
  return (
    <div className={`section-heading is-${align} ${className}`.trim()}>
      {eyebrow && (
        <span className="eyebrow">
          <SparkleIcon size={12} /> {eyebrow}
        </span>
      )}
      <Tag className="section-title">{title}</Tag>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
