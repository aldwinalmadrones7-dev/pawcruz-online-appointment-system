/**
 * LiveQueueBoard — The clinic's live queue as a display board (final-vet's queue display):
 * one lane per veterinarian with the queue number being served now, the next patients in
 * line and the estimated wait. It fills the height it is given: a long line scrolls inside its
 * lane, and on phones one lane shows at a time (switch with the buttons above). It shows only
 * queue numbers and pet names, never owner details. `mineIds` highlights the signed-in pet
 * owner's own visits.
 */
import { useState } from 'react';
import { FaUserMd } from 'react-icons/fa';
import { FiCheck, FiClock, FiUsers } from 'react-icons/fi';
import { getManilaNowMinutes } from '../utils/dateUtils';
import { formatClockTime, formatPetNames, formatShift, formatTime, formatVetName } from '../utils/formatters';
import { timeToMinutes } from '../utils/schedule';
import ImageWithFallback from './ImageWithFallback';
import PetAvatar from './PetAvatar';

const NEXT_SHOWN = 6;

/** "Open now · until 7:00 PM", "Opens today at 9:00 AM", "Closed for today" … */
function clinicLine(clinic, generatedAt) {
  if (!clinic.openToday) return 'Closed today';
  if (clinic.isOpen) return `Open now · until ${formatTime(clinic.closesAt)}`;
  const now = getManilaNowMinutes(new Date(generatedAt));
  return now < timeToMinutes(clinic.opensAt) ? `Opens today at ${formatTime(clinic.opensAt)}` : 'Closed for today';
}

function laneLabel(lane) {
  if (lane.status === 'on') return 'On duty';
  if (lane.status === 'later') return `Starts ${formatTime(lane.vet.shiftStart)}`;
  if (lane.status === 'ended') return lane.serving || lane.waiting.length ? 'Finishing up' : 'Shift ended';
  return 'Off today';
}

/** What the "Now serving" panel says when nobody is with the vet. */
function idleText(lane) {
  if (lane.waiting.length) return 'Calling the next patient soon';
  if (lane.status === 'later') return `First patients from ${formatTime(lane.vet.shiftStart)}`;
  if (lane.status === 'on') return lane.expectedCount ? 'No one waiting right now' : 'No more patients today';
  return 'Done for today';
}

function YouChip() {
  return <span className="queue-you">You</span>;
}

function QueueLane({ lane, mineIds, hiddenOnPhone }) {
  const { vet, serving, waiting } = lane;
  const shown = waiting.slice(0, NEXT_SHOWN);
  const servingIsMine = serving && mineIds.includes(serving.id);

  return (
    <section className={`queue-lane${hiddenOnPhone ? ' is-phone-hidden' : ''}`} aria-label={`${formatVetName(vet)}'s queue`}>
      <header className="queue-lane-head">
        <ImageWithFallback src={vet.photo} alt="" icon={FaUserMd} className="queue-lane-photo" />
        <div className="queue-lane-title">
          <h2>{formatVetName(vet)}</h2>
          <small>{formatShift(vet)}</small>
        </div>
        <span className={`queue-lane-status is-${lane.status}`}>{laneLabel(lane)}</span>
      </header>

      <div className={`queue-now${serving ? '' : ' is-idle'}${servingIsMine ? ' is-mine' : ''}`} aria-live="polite">
        <span className="queue-now-label">Now serving</span>
        <strong className="queue-now-number">{serving?.queueNumber ?? '—'}</strong>
        <span className="queue-now-pets">
          {serving ? formatPetNames(serving.pets) : idleText(lane)}
          {servingIsMine && <YouChip />}
        </span>
      </div>

      <div className="queue-next">
        <div className="queue-next-head">
          <span>Next in line</span>
          <span>
            <FiUsers aria-hidden="true" /> {waiting.length} waiting
          </span>
        </div>
        {shown.length ? (
          <ol className="queue-next-list">
            {shown.map((ticket) => {
              const mine = mineIds.includes(ticket.id);
              return (
                <li key={ticket.id} className={mine ? 'is-mine' : undefined}>
                  <span className="queue-pos" aria-label={`Position ${ticket.position}`}>
                    {ticket.position}
                  </span>
                  <span className="queue-num">{ticket.queueNumber}</span>
                  <span className="queue-pets">
                    <PetAvatar species={ticket.pets[0]?.species} size={26} />
                    <span className="text-truncate">{formatPetNames(ticket.pets)}</span>
                    {mine && <YouChip />}
                    {ticket.late && (
                      <span className="queue-late" title="Checked in more than 15 minutes after the booked time">
                        Late
                      </span>
                    )}
                  </span>
                  <span className="queue-eta">{ticket.waitMinutes > 0 ? `~${ticket.waitMinutes} min` : 'Next'}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="queue-next-empty">No one is waiting in this lane.</p>
        )}
        {waiting.length > shown.length && <p className="queue-more">+{waiting.length - shown.length} more waiting</p>}
      </div>

      <footer className="queue-lane-foot">
        {lane.status === 'on' || waiting.length ? (
          <span>
            <FiClock aria-hidden="true" /> Est. wait now: {lane.waitMinutes > 0 ? `~${lane.waitMinutes} min` : 'none'}
          </span>
        ) : (
          <span>
            <FiCheck aria-hidden="true" /> {lane.doneCount} seen today
          </span>
        )}
        <span>{lane.expectedCount ? `${lane.expectedCount} more booked today` : 'No more bookings today'}</span>
      </footer>
    </section>
  );
}

export default function LiveQueueBoard({ board, mineIds = [], refreshing = false, failed = false }) {
  const { clinic, totals, lanes, generatedAt } = board;
  const [picked, setPicked] = useState(0);
  const active = Math.min(picked, Math.max(lanes.length - 1, 0)); // lanes can change between refreshes

  return (
    <div className="queue-board">
      <div className="queue-board-head">
        <span className={`queue-live${clinic.isOpen ? ' is-open' : ''}`}>
          <span className="queue-live-dot" aria-hidden="true" /> {clinic.isOpen ? 'Live' : 'Closed'}
        </span>
        <span className="queue-board-clinic">{clinicLine(clinic, generatedAt)}</span>
        <ul className="queue-totals" aria-label="Today's queue">
          <li>
            <strong>{totals.serving}</strong> with the vet
          </li>
          <li>
            <strong>{totals.waiting}</strong> waiting
          </li>
          <li>
            <strong>{totals.done}</strong> done today
          </li>
        </ul>
        <span className={`queue-updated${failed ? ' is-stale' : ''}`}>
          {failed ? "Couldn't refresh · showing" : 'Updated'} {formatClockTime(generatedAt)}
          {refreshing && !failed ? '…' : ''}
        </span>
      </div>

      {lanes.length > 1 && (
        <div className="queue-lane-switch" role="group" aria-label="Choose a veterinarian">
          {lanes.map((lane, index) => (
            <button key={lane.vet.id} type="button" className={index === active ? 'is-active' : undefined} aria-pressed={index === active} onClick={() => setPicked(index)}>
              <strong>{formatVetName(lane.vet)}</strong>
              <small>
                {lane.serving ? `Now ${lane.serving.queueNumber}` : laneLabel(lane)} · {lane.waiting.length} waiting
              </small>
            </button>
          ))}
        </div>
      )}

      {lanes.length ? (
        <div className="queue-lanes">
          {lanes.map((lane, index) => (
            <QueueLane key={lane.vet.id} lane={lane} mineIds={mineIds} hiddenOnPhone={index !== active} />
          ))}
        </div>
      ) : (
        <div className="queue-board-empty">
          <FaUserMd aria-hidden="true" />
          <h2>No veterinarians on duty today</h2>
          <p>The queue opens again on the next clinic day.</p>
        </div>
      )}
    </div>
  );
}
