/**
 * EmptyState — Friendly placeholder for empty lists, "no results" and errors,
 * with an optional action button.
 */
import { PawIcon, SparkleIcon } from './BrandIcons';

export default function EmptyState({ icon: Icon, title, message, action, compact = false, tone = 'brand' }) {
  return (
    <div className={`empty-state tone-${tone}${compact ? ' is-compact' : ''}`}>
      <div className="empty-illustration" aria-hidden="true">
        {Icon ? <Icon /> : <PawIcon size={compact ? 30 : 42} shine />}
        <SparkleIcon size={14} className="empty-spark empty-spark-1" />
        <SparkleIcon size={9} className="empty-spark empty-spark-2" />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
