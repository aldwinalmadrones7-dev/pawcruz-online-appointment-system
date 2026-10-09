/**
 * QueueStageBadge — Pill showing where a visit is in today's live queue: not arrived yet,
 * waiting, with the vet, or done. Icon + text, so it never relies on color alone.
 */
import { FiActivity, FiCheck, FiClock, FiUsers } from 'react-icons/fi';
import { QUEUE_STAGE } from '../utils/constants';

const STAGES = {
  [QUEUE_STAGE.EXPECTED]: { className: 'is-expected', icon: FiClock, label: 'Not arrived' },
  [QUEUE_STAGE.WAITING]: { className: 'is-waiting', icon: FiUsers, label: 'Waiting' },
  [QUEUE_STAGE.SERVING]: { className: 'is-serving', icon: FiActivity, label: 'With the vet' },
  [QUEUE_STAGE.DONE]: { className: 'is-done', icon: FiCheck, label: 'Done' },
};

export default function QueueStageBadge({ stage }) {
  const style = STAGES[stage];
  if (!style) return null;
  const { className, icon: Icon, label } = style;
  return (
    <span className={`status-badge queue-stage ${className}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}
