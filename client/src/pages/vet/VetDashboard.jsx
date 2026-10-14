/**
 * VetDashboard — The veterinarian's overview: KPI cards, your lane in the live queue right
 * now, the vets on duty today, the appointments-per-day chart for this week, the status
 * breakdown and today's schedule (with each visit's queue stage). Reminds a new vet to set
 * their schedule, and keeps the "Reset demo data" button for presentations.
 */
import { useState } from 'react';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiActivity, FiCalendar, FiCheckCircle, FiHeart, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PetAvatar from '../../components/PetAvatar';
import QueueStageBadge from '../../components/QueueStageBadge';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import usePolling from '../../hooks/usePolling';
import { getDashboardStats } from '../../services/appointmentService';
import { resetDemoData } from '../../services/demoService';
import { getQueueBoard } from '../../services/queueService';
import { getMyVetProfile } from '../../services/vetService';
import { getLiveQueueStage } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUSES, QUEUE_REFRESH_MS } from '../../utils/constants';
import { formatClockTime, formatPetNames, formatShift, formatTime, formatVetName, getFullName, getGreeting } from '../../utils/formatters';

/** "Your queue right now": who is with you, and the next patients in your lane. */
function MyLaneCard({ lane }) {
  if (!lane) {
    return <EmptyState compact icon={FiUsers} title="You're not on duty today" message="Your lane appears on the days you're on duty. Pet owners book you inside your shift." />;
  }
  const { serving, waiting } = lane;
  return (
    <>
      <div className="dash-now">
        <div className="queue-badge is-large" aria-label={serving ? `Now serving queue ${serving.queueNumber}` : 'No one is being served'}>
          <small>Now</small>
          <strong>{serving?.queueNumber ?? '—'}</strong>
        </div>
        <div className="min-w-0">
          <strong className="d-block">{serving ? formatPetNames(serving.pets) : 'No one is with you right now'}</strong>
          <small className="text-muted-soft">
            {serving
              ? `${getFullName(serving.owner)} · called in at ${formatClockTime(serving.servedAt)}`
              : waiting.length
                ? `${waiting.length} waiting — call the next patient from the Live Queue page.`
                : 'No one is waiting in your lane.'}
          </small>
        </div>
      </div>
      <h3 className="lane-heading mt-3">
        Next in line <span className="sidebar-badge is-static">{waiting.length}</span>
      </h3>
      {waiting.length ? (
        <ul className="mini-queue">
          {waiting.slice(0, 4).map((ticket) => (
            <li key={ticket.id}>
              <span className="queue-pos is-light">{ticket.position}</span>
              <strong>{ticket.queueNumber}</strong>
              <span className="text-truncate">{formatPetNames(ticket.pets)}</span>
              <small>booked {formatTime(ticket.startTime)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lane-empty">{lane.expected.length ? `${lane.expected.length} more booked today, not arrived yet.` : 'No more patients booked today.'}</p>
      )}
    </>
  );
}

export default function VetDashboard() {
  const { user } = useAuth();
  const { data: stats, loading, error, reload } = useAsync(() => getDashboardStats(), []);
  const queue = usePolling(() => getQueueBoard(), QUEUE_REFRESH_MS);
  const { data: myVet } = useAsync(() => getMyVetProfile(), []);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const queueTotals = queue.data?.totals ?? stats?.queue;
  const myLane = queue.data?.lanes.find((lane) => lane.vet.id === user.vetId);

  async function handleReset() {
    setResetting(true);
    try {
      await resetDemoData();
      toast.success('Demo data restored — today’s queue was rebuilt around the current time.');
      setShowReset(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Veterinarian portal"
        title={`${getGreeting()}, Dr. ${user.lastName}`}
        subtitle="Your queue, the vets on duty and this week’s bookings at a glance."
        actions={
          <>
            <Button variant="soft" onClick={() => setShowReset(true)}>
              <FiRefreshCw aria-hidden="true" /> Reset demo data
            </Button>
            <Button as={Link} to="/vet/queue" variant="cta">
              <FiUsers aria-hidden="true" /> Open live queue
            </Button>
          </>
        }
      />

      {myVet && !myVet.availableDays.length && (
        <Alert variant="soft" className="d-flex flex-wrap gap-2 align-items-center">
          <strong>Your schedule is empty, so pet owners can’t book you yet.</strong>
          <Link to="/vet/profile?tab=schedule" className="fw-bold">
            Set your duty days and shift →
          </Link>
        </Alert>
      )}

      {loading && !stats ? (
        <LoadingSpinner label="Crunching today's numbers…" />
      ) : error ? (
        <EmptyState title="We couldn't load the dashboard" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
      ) : (
        <div className={loading ? 'is-refreshing' : ''}>
          <Row className="g-3 g-lg-4 mb-4">
            <Col sm={6} xl={3}>
              <StatCard icon={FiCalendar} label="Today's appointments" value={stats.today.length} hint={`${stats.walkInsToday} walk-in${stats.walkInsToday === 1 ? '' : 's'}`} tone="brand" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard
                icon={FiActivity}
                label="In the queue now"
                value={(queueTotals?.waiting ?? 0) + (queueTotals?.serving ?? 0)}
                hint={`${queueTotals?.waiting ?? 0} waiting · ${queueTotals?.serving ?? 0} with a vet`}
                tone="amber"
              />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiCheckCircle} label="Completed this month" value={stats.completedThisMonth} hint="Finished consultations" tone="success" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiHeart} label="Registered pets" value={stats.registeredPets} hint="Animal patients" tone="accent" />
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col xl={7}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Your queue right now</h2>
                    <Link to="/vet/queue" className="fw-bold small">
                      Open live queue
                    </Link>
                  </div>
                  {queue.data ? <MyLaneCard lane={myLane} /> : <LoadingSpinner compact label="Loading the queue…" />}
                </div>
              </div>
            </Col>
            <Col xl={5}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Vets on duty today</h2>
                    <span className="sidebar-badge is-static">{stats.vetsOnDuty.length}</span>
                  </div>
                  {stats.vetsOnDuty.length ? (
                    <ul className="approval-list">
                      {stats.vetsOnDuty.map((vet) => (
                        <li key={vet.id}>
                          <ImageWithFallback src={vet.photo} alt="" icon={FaUserMd} className="duty-photo" />
                          <span className="approval-text">
                            <strong>{formatVetName(vet)}</strong>
                            <small>
                              {formatShift(vet)} · {vet.waiting} waiting
                            </small>
                          </span>
                          <span className="duty-count" title="Appointments today">
                            <strong>{vet.appointmentsToday}</strong>
                            <small>today</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState compact icon={FaUserMd} title="No vets on duty" message="Check the veterinarians' schedules." />
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col xl={8}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <WeeklyBarChart data={stats.week} />
                </div>
              </div>
            </Col>
            <Col xl={4}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Status overview</h2>
                    <span className="text-muted-soft small">{stats.totals.total} total</span>
                  </div>
                  <ul className="status-meters">
                    {APPOINTMENT_STATUSES.map((status) => {
                      const count = stats.totals[status.toLowerCase()];
                      const percent = stats.totals.total ? Math.round((count / stats.totals.total) * 100) : 0;
                      return (
                        <li key={status}>
                          <div className="meter-row">
                            <StatusBadge status={status} />
                            <strong>
                              {count} <small>({percent}%)</small>
                            </strong>
                          </div>
                          <div className={`meter is-${status.toLowerCase()}`} aria-hidden="true">
                            <span style={{ width: `${percent}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </Col>
          </Row>

          <div className="pc-card">
            <div className="pc-card-body">
              <div className="card-title-row">
                <h2>Today’s schedule</h2>
                <Link to="/vet/appointments" className="fw-bold small">
                  All appointments
                </Link>
              </div>
              {stats.today.length ? (
                <ul className="schedule-list">
                  {stats.today.map((appointment) => {
                    const stage = getLiveQueueStage(appointment);
                    return (
                      <li key={appointment.id} className={`schedule-item is-${appointment.status.toLowerCase()}`}>
                        <span className="schedule-time">
                          <strong>{formatTime(appointment.startTime)}</strong>
                          <small>Queue {appointment.queueNumber}</small>
                        </span>
                        <PetAvatar species={appointment.pet.species} size={36} />
                        <span className="schedule-body">
                          <strong>
                            {appointment.pet.name} <small className="fw-normal">· {getFullName(appointment.owner)}</small>
                          </strong>
                          <small>
                            {appointment.service.name} · <FaUserMd aria-hidden="true" /> {formatVetName(appointment.vet)}
                          </small>
                        </span>
                        {stage ? <QueueStageBadge stage={stage} /> : <StatusBadge status={appointment.status} />}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState compact icon={FiCalendar} title="No appointments today" message="A quiet day — walk-ins can be registered from the Live Queue page." />
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showReset}
        title="Reset all demo data?"
        message="Appointments, pets, vets, services and new accounts go back to the original sample data, with dates rebuilt around today and a fresh live queue for right now."
        confirmLabel="Reset data"
        variant="brand"
        icon={FiRefreshCw}
        busy={resetting}
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
      />
    </div>
  );
}
