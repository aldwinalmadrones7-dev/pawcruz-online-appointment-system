/**
 * LiveQueue — The veterinarian's queue desk (final-vet's Queue Management): today's numbers,
 * then one lane per vet (yours first). Check pets in as they arrive, call them in one at a
 * time, complete each visit or step back, and register walk-ins straight into the queue.
 * It refreshes every 15 seconds; the public Live Queue page (/queue) shows the same queue.
 */
import { useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FiActivity, FiCheckCircle, FiClock, FiExternalLink, FiUserPlus, FiUsers } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppointmentFormModal from '../../components/AppointmentFormModal';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import QueueLaneManager from '../../components/QueueLaneManager';
import SearchBar from '../../components/SearchBar';
import StatCard from '../../components/StatCard';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import usePolling from '../../hooks/usePolling';
import { callInVisit, checkInVisit, completeVisit, getQueueBoard, undoQueueStep } from '../../services/queueService';
import { getServices } from '../../services/serviceService';
import { getVets } from '../../services/vetService';
import { QUEUE_REFRESH_MS, QUEUE_STAGE } from '../../utils/constants';
import { formatClockTime, formatDateLong, formatPetNames } from '../../utils/formatters';

const ACTIONS = {
  'check-in': {
    run: checkInVisit,
    done: (ticket) => `${ticket.queueNumber} checked in — ${formatPetNames(ticket.pets)} joined the waiting line.`,
  },
  call: {
    run: callInVisit,
    done: (ticket) => `${ticket.queueNumber} called in — ${formatPetNames(ticket.pets)} is with the vet.`,
  },
  complete: {
    run: completeVisit,
    done: (ticket) => `${ticket.queueNumber} completed — ${formatPetNames(ticket.pets)}'s visit is done.`,
  },
  undo: {
    run: undoQueueStep,
    done: (ticket) =>
      ticket.stage === QUEUE_STAGE.SERVING ? `${ticket.queueNumber} is back in the waiting line.` : `Check-in undone — ${ticket.queueNumber} is marked as not arrived.`,
  },
};

export default function LiveQueue() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: board, loading, error, reload, setData } = usePolling(() => getQueueBoard(), QUEUE_REFRESH_MS);
  const { data: services } = useAsync(() => getServices(), []);
  const { data: vets } = useAsync(() => getVets(), []);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 200).trim().toLowerCase();
  // The top bar's "Walk-in" button links here with ?walkin=1 to open the form right away.
  const walkInRequested = searchParams.get('walkin') === '1';
  const [showWalkIn, setShowWalkIn] = useState(false);
  const closeWalkIn = () => {
    setShowWalkIn(false);
    if (walkInRequested) setSearchParams({}, { replace: true }); // so a refresh doesn't reopen it
  };

  // Your own lane first, then the others by shift.
  const lanes = useMemo(
    () => [...(board?.lanes ?? [])].sort((a, b) => Number(b.vet.id === user.vetId) - Number(a.vet.id === user.vetId)),
    [board, user.vetId],
  );

  async function handleAction(action, ticket) {
    setBusyId(ticket.id);
    try {
      setData(await ACTIONS[action].run(ticket.id));
      toast.success(ACTIONS[action].done(ticket));
    } catch (err) {
      toast.error(err.message);
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Veterinarian portal"
        title="Live queue"
        subtitle={`${board ? `${formatDateLong(board.date)} · ` : ''}Check pets in as they arrive, call them in one at a time, and complete each visit.`}
        actions={
          <>
            <Button as={Link} to="/queue" variant="soft" target="_blank" rel="noreferrer">
              <FiExternalLink aria-hidden="true" /> Public board
            </Button>
            <Button variant="cta" onClick={() => setShowWalkIn(true)} disabled={!services || !vets}>
              <FiUserPlus aria-hidden="true" /> Register walk-in
            </Button>
          </>
        }
      />

      {loading && !board ? (
        <LoadingSpinner label="Loading today's queue…" />
      ) : !board ? (
        <EmptyState
          title="We couldn't load the queue"
          message={error?.message}
          tone="accent"
          action={
            <Button variant="brand" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <Row className="g-3 g-lg-4 mb-4">
            <Col xs={6} xl={3}>
              <StatCard icon={FiUsers} label="Waiting" value={board.totals.waiting} hint="Checked in" tone="amber" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiActivity} label="With the vet" value={board.totals.serving} hint="Being seen now" tone="accent" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiClock} label="Not arrived yet" value={board.totals.expected} hint="Booked for today" tone="brand" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiCheckCircle} label="Done today" value={board.totals.done} hint="Completed visits" tone="success" />
            </Col>
          </Row>

          <div className="toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Find a pet, owner, mobile or queue number…" label="Search today's queue" className="toolbar-search" />
            <span className="toolbar-count">
              {error ? "Couldn't refresh · showing" : 'Updated'} {formatClockTime(board.generatedAt)} · refreshes every 15 s
            </span>
          </div>

          {lanes.length ? (
            <Row className="g-4">
              {lanes.map((lane) => (
                <Col xl={6} key={lane.vet.id}>
                  <QueueLaneManager lane={lane} isMine={lane.vet.id === user.vetId} query={query} busyId={busyId} onAction={handleAction} />
                </Col>
              ))}
            </Row>
          ) : (
            <EmptyState icon={FiUsers} title="No veterinarians on duty today" message="Lanes appear for vets with a shift today. Check the duty days on your profile." />
          )}
        </>
      )}

      {services && vets && (
        <AppointmentFormModal show={showWalkIn || walkInRequested} appointment={null} services={services} vets={vets} onHide={closeWalkIn} onSaved={() => reload()} />
      )}
    </div>
  );
}
