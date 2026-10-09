/**
 * QueueLaneManager — One veterinarian's lane on the vet Live Queue page (final-vet's Queue
 * Management): the visit with the vet now (complete it, or send it back to waiting), the
 * waiting line in order (call the next patient in — one at a time), pets booked today that
 * haven't arrived (check them in), and today's finished visits.
 */
import { Button } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCheckCircle, FiCornerUpLeft, FiLogIn, FiPlay } from 'react-icons/fi';
import { formatClockTime, formatPetNames, formatShift, formatTime, formatVetName, formatWait, getFullName, minutesSince } from '../utils/formatters';
import ImageWithFallback from './ImageWithFallback';
import PetAvatar from './PetAvatar';

const LANE_STATUS = { on: 'On duty', later: 'Starts later', ended: 'Shift ended', off: 'Off today' };

/** Does a ticket match the search box (queue number, reference, pet, owner or mobile)? */
const ticketMatches = (ticket, query) =>
  !query ||
  [ticket.queueNumber, ticket.reference, getFullName(ticket.owner), ticket.owner.phone, ...ticket.pets.map((pet) => pet.name)].some((value) =>
    String(value ?? '').toLowerCase().includes(query),
  );

function LateChip() {
  return (
    <span className="queue-late is-light" title="Checked in more than 15 minutes after the booked time">
      Late
    </span>
  );
}

function OwnerLine({ ticket }) {
  return (
    <small>
      {getFullName(ticket.owner)} · <a href={`tel:${ticket.owner.phone}`}>{ticket.owner.phone}</a>
    </small>
  );
}

/** "Booked 1:10 PM · Vaccination · walk-in · waiting 5 min" */
const visitLine = (ticket, extra) =>
  [`Booked ${formatTime(ticket.startTime)}`, ticket.reasons.join(', '), ticket.source === 'Walk-In' ? 'walk-in' : '', extra].filter(Boolean).join(' · ');

/** The visit with the vet: queue number, pet avatar and full details. */
function ServingTicket({ ticket }) {
  return (
    <div className="lane-ticket-main">
      <span className="lane-ticket-num">{ticket.queueNumber}</span>
      <PetAvatar species={ticket.pets[0]?.species} size={34} />
      <div className="lane-ticket-text">
        <strong>
          {formatPetNames(ticket.pets)}
          {ticket.late && <LateChip />}
        </strong>
        <OwnerLine ticket={ticket} />
        <small>{visitLine(ticket)}</small>
      </div>
    </div>
  );
}

/** A compact row summary: number and pets on one line, owner and visit details below. */
function RowTicket({ ticket, extra }) {
  return (
    <div className="lane-row-main">
      <div className="lane-row-title">
        <span className="lane-ticket-num is-small">{ticket.queueNumber}</span>
        <strong className="text-truncate">{formatPetNames(ticket.pets)}</strong>
        {ticket.late && <LateChip />}
      </div>
      <OwnerLine ticket={ticket} />
      <small>{visitLine(ticket, extra)}</small>
    </div>
  );
}

export default function QueueLaneManager({ lane, isMine, query, busyId, onAction }) {
  const { vet, serving } = lane;
  const waiting = lane.waiting.filter((ticket) => ticketMatches(ticket, query));
  const expected = lane.expected.filter((ticket) => ticketMatches(ticket, query));
  const done = lane.done.filter((ticket) => ticketMatches(ticket, query));
  const next = lane.waiting[0];
  const busy = (ticket) => busyId === ticket.id;

  return (
    <article className={`pc-card h-100 lane-wrap${isMine ? ' is-mine' : ''}`}>
      <div className="pc-card-body lane-card">
        <header className="lane-card-head">
          <ImageWithFallback src={vet.photo} alt="" icon={FaUserMd} className="queue-lane-photo" />
          <div className="lane-card-title">
            <h2>{formatVetName(vet)}</h2>
            <small>Shift {formatShift(vet)}</small>
          </div>
          {isMine && <span className="lane-chip">Your lane</span>}
          <span className={`lane-chip${lane.status === 'on' ? ' is-on' : ''}`}>{LANE_STATUS[lane.status]}</span>
        </header>

        <section className={`lane-serving${serving ? '' : ' is-idle'}`} aria-live="polite">
          <span className="lane-label">With the vet</span>
          {serving ? (
            <>
              <ServingTicket ticket={serving} />
              <p className="lane-meta">
                Called in at {formatClockTime(serving.servedAt)} ({minutesSince(serving.servedAt)} min ago) · {serving.minutes}-minute visit
              </p>
              <div className="lane-actions">
                <Button variant="brand" size="sm" disabled={busy(serving)} onClick={() => onAction('complete', serving)}>
                  <FiCheckCircle aria-hidden="true" /> Complete visit
                </Button>
                <Button variant="soft" size="sm" disabled={busy(serving)} onClick={() => onAction('undo', serving)}>
                  <FiCornerUpLeft aria-hidden="true" /> Back to waiting
                </Button>
              </div>
            </>
          ) : (
            <div className="lane-idle">
              <p>No one is with {formatVetName(vet)} right now.</p>
              {next && (
                <Button variant="cta" size="sm" disabled={busy(next)} onClick={() => onAction('call', next)}>
                  <FiPlay aria-hidden="true" /> Call next: {next.queueNumber} · {formatPetNames(next.pets)}
                </Button>
              )}
            </div>
          )}
        </section>

        <section>
          <h3 className="lane-heading">
            Waiting <span className="sidebar-badge is-static">{lane.waiting.length}</span>
            {lane.waiting.length > 0 && <small>· new arrivals wait {formatWait(lane.waitMinutes)}</small>}
          </h3>
          {waiting.length ? (
            <ol className="lane-list">
              {waiting.map((ticket) => (
                <li key={ticket.id} className="lane-row">
                  <span className="queue-pos is-light" aria-label={`Position ${ticket.position}`}>
                    {ticket.position}
                  </span>
                  <RowTicket ticket={ticket} extra={`waiting ${minutesSince(ticket.checkedInAt)} min`} />
                  <div className="lane-row-actions">
                    <Button
                      variant="brand"
                      size="sm"
                      disabled={busy(ticket) || Boolean(serving)}
                      title={serving ? `Complete ${serving.queueNumber} first — one patient at a time` : undefined}
                      onClick={() => onAction('call', ticket)}
                    >
                      <FiPlay aria-hidden="true" /> Call in
                    </Button>
                    <Button
                      variant="soft"
                      size="sm"
                      className="btn-icon"
                      disabled={busy(ticket)}
                      title="Undo check-in"
                      aria-label={`Undo check-in for ${ticket.queueNumber}`}
                      onClick={() => onAction('undo', ticket)}
                    >
                      <FiCornerUpLeft aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="lane-empty">{query && lane.waiting.length ? 'No waiting patient matches your search.' : 'No one is waiting in this lane.'}</p>
          )}
        </section>

        <section>
          <h3 className="lane-heading">
            Not arrived yet <span className="sidebar-badge is-static">{lane.expected.length}</span>
          </h3>
          {expected.length ? (
            <ul className="lane-list">
              {expected.map((ticket) => (
                <li key={ticket.id} className="lane-row">
                  <span className="lane-time">{formatTime(ticket.startTime)}</span>
                  <RowTicket ticket={ticket} />
                  <div className="lane-row-actions">
                    <Button variant="outline-ink" size="sm" disabled={busy(ticket)} onClick={() => onAction('check-in', ticket)}>
                      <FiLogIn aria-hidden="true" /> Check in
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="lane-empty">{query && lane.expected.length ? 'No booking matches your search.' : 'Everyone booked today has arrived.'}</p>
          )}
        </section>

        {lane.done.length > 0 && (
          <details className="lane-done">
            <summary>Done today ({lane.done.length})</summary>
            <ul>
              {done.map((ticket) => (
                <li key={ticket.id}>
                  <span>
                    <strong>{ticket.queueNumber}</strong> · {formatPetNames(ticket.pets)}
                  </span>
                  <span>{ticket.completedAt ? `finished ${formatClockTime(ticket.completedAt)}` : 'completed'}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
