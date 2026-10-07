/**
 * ServiceCard — Service photo, category, name, description, duration and peso price.
 * Pass `onSelect` to make the whole card a selectable option (booking wizard),
 * or `action` to show a button underneath (Services page).
 */
import { FiCheck, FiClock } from 'react-icons/fi';
import { formatCurrency, formatDuration } from '../utils/formatters';
import ImageWithFallback from './ImageWithFallback';

export default function ServiceCard({ service, selected = false, onSelect, action, compact = false }) {
  const classes = ['service-card', onSelect ? 'is-selectable' : 'hover-lift', selected ? 'is-selected' : ''].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <div className="service-media">
        <ImageWithFallback src={service.image} alt={service.name} ratio="4 / 3" />
        <span className="service-category">{service.category}</span>
        {selected && (
          <span className="selected-check" aria-hidden="true">
            <FiCheck />
          </span>
        )}
      </div>
      <div className="service-body">
        <h3 className="service-name">{service.name}</h3>
        {!compact && <p className="service-desc">{service.description}</p>}
        <div className="service-meta">
          <span>
            <FiClock aria-hidden="true" /> {formatDuration(service.duration)}
          </span>
          <strong className="service-price">{formatCurrency(service.price)}</strong>
        </div>
        {action && <div className="service-action">{action}</div>}
      </div>
      {onSelect && (
        <button
          type="button"
          className="stretched-select"
          onClick={() => onSelect(service)}
          aria-pressed={selected}
          aria-label={`${service.name}, ${formatCurrency(service.price)}, ${formatDuration(service.duration)}`}
        />
      )}
    </article>
  );
}
