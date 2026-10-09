/**
 * LiveQueuePage — The clinic's live queue on its own page (/queue), like final-vet's queue
 * display: the site navbar, then each veterinarian's lane with the queue number being served,
 * the next patients in line and the estimated wait, refreshed every 15 seconds. The page fits
 * the screen and never scrolls. It shows only queue numbers and pet names; a logged-in pet
 * owner also sees their own place in line.
 */
import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { FiLock, FiLogIn, FiRefreshCw, FiWifiOff } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { SparkleIcon } from '../../components/BrandIcons';
import LiveQueueBoard from '../../components/LiveQueueBoard';
import LoadingSpinner from '../../components/LoadingSpinner';
import MyQueueTickets from '../../components/MyQueueTickets';
import Navbar from '../../components/Navbar';
import useAuth from '../../hooks/useAuth';
import usePolling from '../../hooks/usePolling';
import { getMyQueue, getPublicQueue } from '../../services/queueService';
import { QUEUE_REFRESH_MS, QUEUE_STAGE, ROLES } from '../../utils/constants';
import { getManilaToday } from '../../utils/dateUtils';
import { formatClockTime, formatDateLong } from '../../utils/formatters';

/** Manila time, ticking every second (its own component, so the board doesn't re-render each second). */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="queue-clock">
      <strong>{formatClockTime(now, { seconds: true })}</strong>
      <small>{formatDateLong(getManilaToday(now))}</small>
    </div>
  );
}

export default function LiveQueuePage() {
  const { role } = useAuth();
  const isOwner = role === ROLES.OWNER;
  const board = usePolling(() => getPublicQueue(), QUEUE_REFRESH_MS);
  const mine = usePolling(() => (isOwner ? getMyQueue() : Promise.resolve(null)), QUEUE_REFRESH_MS, [isOwner]);
  const myTickets = isOwner ? (mine.data?.tickets ?? []) : [];
  const openTickets = myTickets.filter((ticket) => ticket.stage !== QUEUE_STAGE.DONE);

  return (
    <div className="queue-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="queue-page">
        <div className="queue-page-inner">
          <header className="queue-page-head">
            <div>
              <span className="eyebrow">
                <SparkleIcon size={12} /> Live queue
              </span>
              <h1 className="queue-page-title">Who’s in line right now</h1>
            </div>
            <LiveClock />
          </header>

          {openTickets.length > 0 && (
            <div className="my-queue-panel">
              <MyQueueTickets tickets={openTickets} today={mine.data.date} />
            </div>
          )}

          {board.data ? (
            <LiveQueueBoard board={board.data} mineIds={myTickets.map((ticket) => ticket.id)} refreshing={board.loading} failed={Boolean(board.error)} />
          ) : board.error ? (
            <div className="queue-board queue-board-empty" role="alert">
              <FiWifiOff aria-hidden="true" />
              <h2>The live queue can’t load right now</h2>
              <p>{board.error.message}</p>
              <p className="small">This page tries again by itself every 15 seconds.</p>
              <Button variant="cta" onClick={board.reload}>
                <FiRefreshCw aria-hidden="true" /> Try again
              </Button>
            </div>
          ) : (
            <div className="queue-page-loading">
              <LoadingSpinner label="Loading the live queue…" />
            </div>
          )}

          <p className="queue-note">
            <FiLock aria-hidden="true" /> Only queue numbers and pet names are shown — owners’ details stay private.
            {role === null && (
              <>
                {' '}
                <Link to="/login">
                  <FiLogIn aria-hidden="true" /> Log in
                </Link>{' '}
                to see your own place in line.
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
