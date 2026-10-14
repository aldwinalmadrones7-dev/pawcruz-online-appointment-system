/**
 * StatusBadge — Pill showing an appointment status with an icon and a color
 * (Confirmed, Completed, Cancelled). Never relies on color alone.
 */
import { FiCheck, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const STATUS_STYLES = {
  Confirmed: { className: 'is-confirmed', icon: FiCheckCircle },
  Completed: { className: 'is-completed', icon: FiCheck },
  Cancelled: { className: 'is-cancelled', icon: FiXCircle },
};

export default function StatusBadge({ status }) {
  const { className, icon: Icon } = STATUS_STYLES[status] ?? STATUS_STYLES.Confirmed;
  return (
    <span className={`status-badge ${className}`}>
      <Icon aria-hidden="true" />
      {status}
    </span>
  );
}
