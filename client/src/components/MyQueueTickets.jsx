/**
 * MyQueueTickets — A pet owner's visits today in the live queue: queue number, where the
 * visit is (not arrived yet, waiting, with the vet, done), place in line and estimated wait.
 */
import { QUEUE_STAGE } from '../utils/constants';
import { isDateTimePast } from '../utils/dateUtils';
import { formatClockTime, formatOrdinal, formatPetNames, formatTime, formatVetName, formatWait } from '../utils/formatters';
import QueueStageBadge from './QueueStageBadge';

function describe(ticket, today) {
  const pets = formatPetNames(ticket.pets);
  const vet = formatVetName(ticket.vet);
  switch (ticket.stage) {
    case QUEUE_STAGE.WAITING:
      return {
        title: ticket.position === 1 ? `${pets} is next in line for ${vet}` : `${pets} is ${formatOrdinal(ticket.position)} in line for ${vet}`,
        text: ticket.ahead
          ? `${ticket.ahead} visit${ticket.ahead === 1 ? '' : 's'} ahead of you · ${formatWait(ticket.waitMinutes)}. Please stay near the front desk.`
          : 'You’re next — please stay near the front desk.',
      };
    case QUEUE_STAGE.SERVING:
      return { title: `${pets} is with ${vet} now`, text: `Called in at ${formatClockTime(ticket.servedAt)}.` };
    case QUEUE_STAGE.DONE:
      return { title: `${pets}’s visit is done`, text: `Finished at ${formatClockTime(ticket.completedAt)}. Thank you for visiting PawCruz!` };
    default:
      return {
        title: `${pets} · booked ${formatTime(ticket.startTime)} with ${vet}`,
        text: isDateTimePast(today, ticket.startTime)
          ? 'Your booked time has passed — check in at the front desk as soon as you arrive.'
          : 'Check in at the front desk when you arrive (about 10 minutes early) to join the line.',
      };
  }
}

export default function MyQueueTickets({ tickets, today }) {
  return (
    <ul className="my-queue">
      {tickets.map((ticket) => {
        const { title, text } = describe(ticket, today);
        return (
          <li key={ticket.id} className={`my-queue-item is-${ticket.stage.toLowerCase()}`}>
            <div className="queue-badge" aria-label={`Queue number ${ticket.queueNumber}`}>
              <small>Queue</small>
              <strong>{ticket.queueNumber}</strong>
            </div>
            <div className="my-queue-text">
              <strong>{title}</strong>
              <small>{text}</small>
            </div>
            <QueueStageBadge stage={ticket.stage} />
          </li>
        );
      })}
    </ul>
  );
}
