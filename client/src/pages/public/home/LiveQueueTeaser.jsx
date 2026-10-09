/**
 * LiveQueueTeaser — A slim live-queue strip under the home hero: the queue number each
 * veterinarian is serving right now and how many are waiting. The whole strip links to the
 * Live Queue page (/queue). Refreshes every 15 seconds.
 */
import { Container } from 'react-bootstrap';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import usePolling from '../../../hooks/usePolling';
import { getPublicQueue } from '../../../services/queueService';
import { QUEUE_REFRESH_MS } from '../../../utils/constants';
import { formatVetName } from '../../../utils/formatters';

export default function LiveQueueTeaser() {
  const { data } = usePolling(() => getPublicQueue(), QUEUE_REFRESH_MS);
  const lanes = data?.lanes ?? [];
  const isOpen = Boolean(data?.clinic.isOpen);

  return (
    <section className="queue-teaser-wrap" aria-label="Live queue">
      <Container>
        <Link to="/queue" className="queue-teaser">
          <span className={`queue-live${isOpen ? ' is-open' : ''}`}>
            <span className="queue-live-dot" aria-hidden="true" /> {isOpen ? 'Live queue' : 'Queue'}
          </span>
          {lanes.length ? (
            <span className="queue-teaser-lanes">
              <span className="queue-teaser-label">Now serving</span>
              {lanes.map((lane) => (
                <span key={lane.vet.id} className="queue-teaser-lane">
                  <small>{formatVetName(lane.vet)}</small>
                  <strong>{lane.serving?.queueNumber ?? '—'}</strong>
                  <em>{lane.waiting.length} waiting</em>
                </span>
              ))}
            </span>
          ) : (
            <span className="queue-teaser-lanes">
              <span className="queue-teaser-text">See who’s in line at the clinic before you head out.</span>
            </span>
          )}
          <span className="queue-teaser-cta">
            Open live queue <FiArrowRight aria-hidden="true" />
          </span>
        </Link>
      </Container>
    </section>
  );
}
