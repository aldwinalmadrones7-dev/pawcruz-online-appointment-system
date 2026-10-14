/**
 * VetDashboard — The veterinarian's day: today's accepted visits in queue order, visits
 * from earlier days still waiting for a medical record, and the next accepted visits.
 * Each visit opens the medical record form, which completes it.
 */
import { useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiClipboard, FiClock, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import MedicalRecordModal from '../../components/MedicalRecordModal';
import PageHeader from '../../components/PageHeader';
import PetAvatar from '../../components/PetAvatar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import { getVetAppointments } from '../../services/appointmentService';
import { canComplete, compareByDateTime } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUS } from '../../utils/constants';
import { getManilaToday } from '../../utils/dateUtils';
import { formatDateShort, formatTime, getFullName, getGreeting } from '../../utils/formatters';

const { CONFIRMED, COMPLETED } = APPOINTMENT_STATUS;

/** One visit row: time, pet, owner, reason, status and the record button. */
function VisitRow({ appointment, showDate = false, onOpen }) {
  const toComplete = canComplete(appointment);
  return (
    <li className={`schedule-item is-${appointment.status.toLowerCase()}`}>
      <span className="schedule-time">
        <strong>{showDate ? formatDateShort(appointment.date) : formatTime(appointment.startTime)}</strong>
        <small>{showDate ? formatTime(appointment.startTime) : `Queue ${appointment.queueNumber}`}</small>
      </span>
      <PetAvatar species={appointment.pet.species} size={36} />
      <span className="schedule-body">
        <strong>
          {appointment.pet.name} <small className="fw-normal">· {getFullName(appointment.owner)}</small>
        </strong>
        <small>{appointment.service.name}</small>
      </span>
      {toComplete ? (
        <Button variant="brand" size="sm" onClick={() => onOpen(appointment)} aria-label={`Add ${appointment.pet.name}'s medical record`}>
          <FiClipboard aria-hidden="true" /> <span className="d-none d-sm-inline">Add record</span>
        </Button>
      ) : appointment.status === COMPLETED ? (
        <Button variant="soft" size="sm" onClick={() => onOpen(appointment)} aria-label={`View ${appointment.pet.name}'s medical record`}>
          <FiEye aria-hidden="true" /> <span className="d-none d-sm-inline">Record</span>
        </Button>
      ) : (
        <StatusBadge status={appointment.status} />
      )}
    </li>
  );
}

export default function VetDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload, setData } = useAsync(() => getVetAppointments(), []);
  const [selected, setSelected] = useState(null);

  const { today, overdue, upcoming, stats } = useMemo(() => {
    const list = data ?? [];
    const todayKey = getManilaToday();
    const todays = list.filter((a) => a.date === todayKey).sort(compareByDateTime);
    const open = list.filter((a) => a.status === CONFIRMED);
    return {
      today: todays,
      overdue: open.filter((a) => a.date < todayKey).sort(compareByDateTime),
      upcoming: open.filter((a) => a.date > todayKey).sort(compareByDateTime),
      stats: {
        today: todays.length,
        waiting: open.filter((a) => a.date <= todayKey).length,
        completedToday: todays.filter((a) => a.status === COMPLETED).length,
        upcoming: open.filter((a) => a.date > todayKey).length,
      },
    };
  }, [data]);

  const replaceAppointment = (updated) => setData((list) => list.map((a) => (a.id === updated.id ? updated : a)));

  return (
    <div>
      <PageHeader
        eyebrow="Veterinarian portal"
        title={`${getGreeting()}, Dr. ${user.lastName}`}
        subtitle="Visits the clinic has accepted for you. Add the medical record to complete each one. It then goes into the patient’s visit history."
        actions={
          <Button as={Link} to="/vet/appointments" variant="soft">
            <FiCalendar aria-hidden="true" /> All my appointments
          </Button>
        }
      />

      {loading && !data ? (
        <LoadingSpinner label="Loading your day…" />
      ) : error ? (
        <EmptyState title="We couldn't load your appointments" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
      ) : (
        <>
          <Row className="g-3 g-lg-4 mb-4">
            <Col sm={6} xl={3}>
              <StatCard icon={FiCalendar} label="Today's patients" value={stats.today} hint="Accepted for today" tone="brand" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiClipboard} label="Waiting for a record" value={stats.waiting} hint="Today and earlier" tone="amber" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiCheckCircle} label="Completed today" value={stats.completedToday} hint="Records saved" tone="success" />
            </Col>
            <Col sm={6} xl={3}>
              <StatCard icon={FiClock} label="Upcoming" value={stats.upcoming} hint="Accepted, later days" tone="accent" />
            </Col>
          </Row>

          <Row className="g-4">
            <Col xl={7}>
              <div className="pc-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Today’s queue</h2>
                    <span className="text-muted-soft small">
                      {stats.completedToday} of {stats.today} done
                    </span>
                  </div>
                  {today.length ? (
                    <ul className="schedule-list">
                      {today.map((appointment) => (
                        <VisitRow key={appointment.id} appointment={appointment} onOpen={setSelected} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState compact icon={FiCalendar} title="No patients today" message="Visits appear here once the clinic accepts them." />
                  )}
                </div>
              </div>
            </Col>
            <Col xl={5}>
              {overdue.length > 0 && (
                <div className="pc-card mb-4">
                  <div className="pc-card-body">
                    <div className="card-title-row">
                      <h2>
                        <FiAlertCircle aria-hidden="true" className="text-danger" /> Still open from earlier
                      </h2>
                      <span className="sidebar-badge is-static">{overdue.length}</span>
                    </div>
                    <ul className="schedule-list">
                      {overdue.map((appointment) => (
                        <VisitRow key={appointment.id} appointment={appointment} showDate onOpen={setSelected} />
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div className="pc-card">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Next accepted visits</h2>
                    <Link to="/vet/appointments" className="fw-bold small">
                      See all
                    </Link>
                  </div>
                  {upcoming.length ? (
                    <ul className="schedule-list">
                      {upcoming.slice(0, 5).map((appointment) => (
                        <VisitRow key={appointment.id} appointment={appointment} showDate onOpen={setSelected} />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState compact icon={FiClock} title="Nothing scheduled yet" message="New visits show up once the clinic accepts them." />
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}

      <MedicalRecordModal appointment={selected} show={Boolean(selected)} onHide={() => setSelected(null)} onCompleted={replaceAppointment} />
    </div>
  );
}
