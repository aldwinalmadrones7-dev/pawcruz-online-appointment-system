/**
 * AdminDashboard — Clinic overview: KPI cards, appointments-per-day chart for this week,
 * status breakdown, today's schedule (with queue numbers) and the vets on duty today.
 */
import { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiCheckCircle, FiClock, FiHeart, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import PetAvatar from '../../components/PetAvatar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import WeeklyBarChart from '../../components/WeeklyBarChart';
import useAsync from '../../hooks/useAsync';
import { getDashboardStats } from '../../services/appointmentService';
import { resetDemoData } from '../../services/demoService';
import { APPOINTMENT_STATUSES } from '../../utils/constants';
import { formatShift, formatTime, formatVetName, getFullName } from '../../utils/formatters';

export default function AdminDashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => getDashboardStats(), []);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await resetDemoData();
      toast.success('Demo data restored.');
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
        eyebrow="Admin panel"
        title="Clinic overview"
        subtitle="Today’s queue, the vets on duty and this week’s bookings at a glance."
        actions={
          <>
            <Button variant="soft" onClick={() => setShowReset(true)}>
              <FiRefreshCw aria-hidden="true" /> Reset demo data
            </Button>
            <Button as={Link} to="/admin/appointments?new=1" variant="cta">
              <FiPlus aria-hidden="true" /> Register walk-in
            </Button>
          </>
        }
      />

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
              <StatCard icon={FiClock} label="Upcoming confirmed" value={stats.upcomingConfirmed} hint="From now onward" tone="success" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiCheckCircle} label="Completed this month" value={stats.completedThisMonth} hint="Finished consultations" tone="amber" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiHeart} label="Registered pets" value={stats.registeredPets} hint="Animal patients" tone="accent" />
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

          <Row className="g-4">
            <Col xl={7}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Today’s schedule</h2>
                    <Link to="/admin/appointments" className="fw-bold small">
                      All appointments
                    </Link>
                  </div>
                  {stats.today.length ? (
                    <ul className="schedule-list">
                      {stats.today.map((appointment) => (
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
                          <StatusBadge status={appointment.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState compact icon={FiCalendar} title="No appointments today" message="A quiet day — walk-ins can be registered from the Appointments page." />
                  )}
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
                              {vet.specialty} · {formatShift(vet)}
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
        </div>
      )}

      <ConfirmModal
        show={showReset}
        title="Reset all demo data?"
        message="Appointments, pets, vets, services and new accounts go back to the original sample data, with dates rebuilt around today."
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
