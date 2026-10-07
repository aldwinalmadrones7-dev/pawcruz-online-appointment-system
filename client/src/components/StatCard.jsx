/**
 * StatCard — A KPI tile: icon, label, big value and an optional hint line.
 */

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      {Icon && (
        <span className="stat-icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="stat-text">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}
