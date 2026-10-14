/**
 * Owner Dashboard — Welcome banner, today's live queue status (place in line and estimated
 * wait), visit stats, the next appointment with its queue number and a live countdown, the
 * owner's pets, quick actions and a pet-care tip.
 */
import { useMemo } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiCheckCircle, FiChevronRight, FiClock, FiHeart, FiPhone, FiPlus, FiPlusCircle, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { PawIcon, SparkleIcon } from '../../components/BrandIcons';
import CountdownTimer from '../../components/CountdownTimer';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import MyQueueTickets from '../../components/MyQueueTickets';
import PetAvatar from '../../components/PetAvatar';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { PET_CARE_TIPS } from '../../data/siteContent';
import useAsync from '../../hooks/useAsync';
import useAuth from '../../hooks/useAuth';
import usePolling from '../../hooks/usePolling';
import { getMyAppointments } from '../../services/appointmentService';
import { getMyPets } from '../../services/petService';
import { getMyQueue } from '../../services/queueService';
import { compareByDateTime, isUpcoming } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUS, CLINIC_INFO, QUEUE_REFRESH_MS } from '../../utils/constants';
import { getManilaToday, parseDateKey, toManilaDateTime } from '../../utils/dateUtils';
import { describePet, formatDateLong, formatDateShort, formatRelativeDay, formatTime, formatTimeRange, formatVetName, getGreeting } from '../../utils/formatters';

const QUICK_ACTIONS = [
  { to: '/owner/book', icon: FiPlusCircle, title: 'Book a visit', text: 'Pets, time and vet' },
  { to: '/owner/pets', icon: FiHeart, title: 'My pets', text: 'Add or update pets' },
  { to: '/owner/appointments', icon: FiCalendar, title: 'Appointments', text: 'Rebook or cancel' },
  { href: `tel:${CLINIC_INFO.phones[0]}`, icon: FiPhone, title: 'Call the clinic', text: CLINIC_INFO.phones[0] },
];

/** Today's visits in the clinic's live queue: place in line and estimated wait (refreshes itself). */
function TodayQueueCard() {
  const { data } = usePolling(() => getMyQueue(), QUEUE_REFRESH_MS);
  if (!data?.tickets.length) return null;
  return (
    <div className="pc-card mb-4">
      <div className="pc-card-body">
        <div className="card-title-row">
          <h2>Today’s queue</h2>
          <Link to="/queue" className="fw-bold small">
            See the live board
          </Link>
        </div>
        <MyQueueTickets tickets={data.tickets} today={data.date} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const appointmentsQuery = useAsync(() => getMyAppointments(), []);
  const petsQuery = useAsync(() => getMyPets(), []);
  const pets = useMemo(() => petsQuery.data ?? [], [petsQuery.data]);

  const { upcoming, stats } = useMemo(() => {
    const list = appointmentsQuery.data ?? [];
    const upcomingList = list.filter(isUpcoming).sort(compareByDateTime);
    return {
      upcoming: upcomingList,
      stats: {
        upcoming: upcomingList.length,
        completed: list.filter((a) => a.status === APPOINTMENT_STATUS.COMPLETED).length,
        cancelled: list.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length,
      },
    };
  }, [appointmentsQuery.data]);

  const next = upcoming[0];
  const nextVisitFor = (petId) => upcoming.find((a) => a.petId === petId);
  const tip = PET_CARE_TIPS[parseDateKey(getManilaToday()).getDate() % PET_CARE_TIPS.length];
  const loading = (appointmentsQuery.loading && !appointmentsQuery.data) || (petsQuery.loading && !petsQuery.data);
  const error = appointmentsQuery.error || petsQuery.error;

  return (
    <div className="dashboard-page">
      <section className="welcome-banner">
        <PawIcon size={170} className="welcome-paw" />
        <SparkleIcon size={22} className="welcome-spark spark-1" />
        <SparkleIcon size={12} className="welcome-spark spark-2" />
        <div className="welcome-copy">
          <p className="welcome-date">{formatDateLong(getManilaToday())}</p>
          <h1>
            {getGreeting()}, {user.firstName}!
          </h1>
          <p>
            {next
              ? `${next.pet.name}'s next visit is ${formatRelativeDay(next.date).toLowerCase()} at ${formatTime(next.startTime)} — queue ${next.queueNumber}.`
              : 'No upcoming visits yet. Book a check-up to keep your pets happy and healthy.'}
          </p>
        </div>
        <Button as={Link} to="/owner/book" variant="cta" size="lg" className="welcome-cta">
          <FiPlusCircle aria-hidden="true" /> Book appointment
        </Button>
      </section>

      <TodayQueueCard />

      {loading ? (
        <LoadingSpinner label="Loading your pets and visits…" />
      ) : error ? (
        <EmptyState
          title="We couldn't load your dashboard"
          message={error.message}
          tone="accent"
          action={
            <Button
              variant="brand"
              onClick={() => {
                appointmentsQuery.reload();
                petsQuery.reload();
              }}
            >
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <Row className="g-3 g-lg-4 mb-4">
            <Col xs={6} xl={3}>
              <StatCard icon={FiClock} label="Upcoming visits" value={stats.upcoming} hint="Confirmed" tone="brand" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiCheckCircle} label="Completed" value={stats.completed} hint="Visits finished" tone="success" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiXCircle} label="Cancelled" value={stats.cancelled} hint="By you or the clinic" tone="accent" />
            </Col>
            <Col xs={6} xl={3}>
              <StatCard icon={FiHeart} label="My pets" value={pets.length} hint="Registered" tone="amber" />
            </Col>
          </Row>

          <Row className="g-4">
            <Col xl={7}>
              <div className="pc-card next-card h-100">
                <div className="pc-card-body">
                  <div className="card-title-row">
                    <h2>Next appointment</h2>
                    {next && <StatusBadge status={next.status} />}
                  </div>
                  {next ? (
                    <>
                      <div className="next-main">
                        <PetAvatar species={next.pet.species} size={84} className="next-pet" />
                        <div>
                          <h3 className="next-service">{next.pet.name}</h3>
                          <p className="next-sub">
                            {next.service.name} · <FaUserMd aria-hidden="true" /> {formatVetName(next.vet)}
                          </p>
                          <p className="next-when">
                            <FiCalendar aria-hidden="true" /> {formatDateLong(next.date)}
                            <br />
                            <FiClock aria-hidden="true" /> {formatTimeRange(next.startTime, next.endTime)}
                          </p>
                        </div>
                        <div className="queue-badge" aria-label={`Queue number ${next.queueNumber}`}>
                          <small>Queue</small>
                          <strong>{next.queueNumber}</strong>
                        </div>
                      </div>
                      <CountdownTimer target={toManilaDateTime(next.date, next.startTime).getTime()} />
                      <div className="next-actions">
                        <Button as={Link} to={`/owner/appointments/${next.id}`} variant="ink" size="sm">
                          View details
                        </Button>
                        <Button as={Link} to="/owner/appointments" variant="outline-ink" size="sm">
                          Manage appointments
                        </Button>
                        <span className="ref-code mono">{next.reference}</span>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      compact
                      title="Nothing booked yet"
                      message={pets.length ? 'Book a visit and a countdown will appear right here.' : 'Add your first pet, then book a visit.'}
                      action={
                        <Button as={Link} to={pets.length ? '/owner/book' : '/owner/pets'} variant="brand">
                          {pets.length ? 'Book now' : 'Add a pet'}
                        </Button>
                      }
                    />
                  )}
                </div>
              </div>
            </Col>

            <Col xl={5}>
              <div className="quick-actions">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const content = (
                    <>
                      <span className="quick-icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span>
                        <strong>{action.title}</strong>
                        <small>{action.text}</small>
                      </span>
                    </>
                  );
                  return action.to ? (
                    <Link key={action.title} to={action.to} className="quick-action hover-lift">
                      {content}
                    </Link>
                  ) : (
                    <a key={action.title} href={action.href} className="quick-action hover-lift">
                      {content}
                    </a>
                  );
                })}
              </div>
              <div className="tip-card">
                <SparkleIcon size={18} />
                <div>
                  <strong>Pet-care tip of the day</strong>
                  <p>{tip}</p>
                </div>
              </div>
            </Col>
          </Row>

          <div className="pc-card mt-4">
            <div className="pc-card-body">
              <div className="card-title-row">
                <h2>My pets</h2>
                <Link to="/owner/pets" className="fw-bold">
                  Manage pets
                </Link>
              </div>
              {pets.length ? (
                <div className="pet-strip">
                  {pets.map((pet) => {
                    const visit = nextVisitFor(pet.id);
                    return (
                      <Link key={pet.id} to={`/owner/book?pet=${pet.id}`} className="pet-chip hover-lift">
                        <PetAvatar species={pet.species} size={46} />
                        <span>
                          <strong>{pet.name}</strong>
                          <small>{describePet(pet)}</small>
                          <em>{visit ? `Next: ${formatDateShort(visit.date)}, ${formatTime(visit.startTime)}` : 'No visit booked'}</em>
                        </span>
                      </Link>
                    );
                  })}
                  <Link to="/owner/pets" className="pet-chip is-add">
                    <span className="pet-add-icon" aria-hidden="true">
                      <FiPlus />
                    </span>
                    <span>
                      <strong>Add a pet</strong>
                      <small>Dog, cat, rabbit, bird…</small>
                    </span>
                  </Link>
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No pets yet"
                  message="Add your pets once and book them in seconds."
                  action={
                    <Button as={Link} to="/owner/pets" variant="brand">
                      Add your first pet
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          {upcoming.length > 1 && (
            <div className="pc-card mt-4">
              <div className="pc-card-body">
                <div className="card-title-row">
                  <h2>Also coming up</h2>
                  <Link to="/owner/appointments" className="fw-bold">
                    View all
                  </Link>
                </div>
                <ul className="mini-list">
                  {upcoming.slice(1, 4).map((appointment) => (
                    <li key={appointment.id}>
                      <Link to={`/owner/appointments/${appointment.id}`}>
                        <span className="mini-date">
                          <strong>{formatDateShort(appointment.date).split(', ')[1]}</strong>
                          <small>{formatDateShort(appointment.date).split(', ')[0]}</small>
                        </span>
                        <span className="mini-text">
                          <strong>
                            {appointment.pet.name} · {appointment.service.name}
                          </strong>
                          <small>
                            {formatTime(appointment.startTime)} · {formatVetName(appointment.vet)} · queue {appointment.queueNumber}
                          </small>
                        </span>
                        <StatusBadge status={appointment.status} />
                        <FiChevronRight className="mini-chevron" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
