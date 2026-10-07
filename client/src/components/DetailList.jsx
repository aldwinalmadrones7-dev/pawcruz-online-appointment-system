/**
 * DetailList — Icon + label + value rows (booking review, confirmation, appointment details).
 */

export default function DetailList({ items }) {
  return (
    <dl className="detail-list">
      {items.filter(Boolean).map(({ icon: Icon, label, value }) => (
        <div key={label} className="detail-row">
          <dt>
            {Icon && <Icon aria-hidden="true" />}
            {label}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
