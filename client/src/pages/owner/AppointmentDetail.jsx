/**
 * AppointmentDetail — One visit: queue number, status timeline, pet profile, vet,
 * schedule, reason and notes, with rebook, cancel, add-to-calendar and print actions.
 */
import { useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiArrowLeft, FiCalendar, FiCheck, FiClipboard, FiClock, FiDollarSign, FiDownload, FiFileText, FiMapPin, FiPrinter, FiRepeat, FiXCircle } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ConfirmModal';
import DetailList from '../../components/DetailList';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import MedicalRecordView from '../../components/MedicalRecordView';
import PetAvatar from '../../components/PetAvatar';
import RebookModal from '../../components/RebookModal';
import StatusBadge from '../../components/StatusBadge';
import useAsync from '../../hooks/useAsync';
import { cancelAppointment, getAppointmentById } from '../../services/appointmentService';
import { canOwnerCancel, canOwnerRebook, getQueueStage, isActive } from '../../utils/appointmentRules';
import { APPOINTMENT_STATUS, CLINIC_INFO, CONSULTATION_TYPE, QUEUE_STAGE } from '../../utils/constants';
import { downloadAppointmentIcs } from '../../utils/calendarFile';
import { describePet, formatClockTime, formatCurrency, formatDateLong, formatRelativeDay, formatTimeRange, formatTimestamp, formatVetName } from '../../utils/formatters';

const { COMPLETED, CANCELLED } = APPOINTMENT_STATUS;

/**
 * Builds the status timeline (bookings are confirmed right away), following the live queue on
 * the visit day: checked in at the front desk → with the vet → completed.
 */
function getTimeline(appointment) {
  const booked = { label: 'Booked & confirmed', detail: formatTimestamp(appointment.createdAt), state: 'done' };
  if (appointment.status === CANCELLED) {
    const by = appointment.cancelledBy === 'clinic' ? 'by the clinic' : 'by you';
    return [booked, { label: 'Cancelled', detail: `${by}${appointment.cancelReason ? ` · ${appointment.cancelReason}` : ''}`, state: 'cancelled' }];
  }
  const done = appointment.status === COMPLETED;
  const stage = getQueueStage(appointment);
  let arrival = `${formatRelativeDay(appointment.date)} · show queue ${appointment.queueNumber} at the front desk`;
  if (appointment.checkedInAt) arrival = `${formatClockTime(appointment.checkedInAt)} · queue ${appointment.queueNumber}`;
  else if (done) arrival = `${formatRelativeDay(appointment.date)} · queue ${appointment.queueNumber}`;
  return [
    booked,
    { label: 'Checked in', detail: arrival, state: appointment.checkedInAt || done ? 'done' : 'current' },
    {
      label: 'With the vet',
      detail: appointment.servedAt ? `Called in at ${formatClockTime(appointment.servedAt)}` : stage === QUEUE_STAGE.WAITING ? 'Waiting in the queue' : 'When it’s your turn',
      state: appointment.servedAt || done ? 'done' : stage === QUEUE_STAGE.WAITING ? 'current' : 'todo',
    },
    { label: 'Completed', detail: done ? 'Thanks for visiting!' : 'After the consultation', state: done ? 'done' : stage === QUEUE_STAGE.SERVING ? 'current' : 'todo' },
  ];
}

export default function AppointmentDetail() {
  const { id } = useParams();
  const { data: appointment, loading, error, setData } = useAsync(() => getAppointmentById(id), [id]);
  const [modal, setModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  if (loading && !appointment) return <LoadingSpinner label="Loading appointment…" />;

  if (error || !appointment) {
    return (
      <EmptyState
        icon={FiCalendar}
        title="Appointment not found"
        message="It may have been removed, or it belongs to another account."
        action={
          <Button as={Link} to="/owner/appointments" variant="brand">
            Back to appointments
          </Button>
        }
      />
    );
  }

  async function confirmCancel() {
    setCancelling(true);
    try {
      const updated = await cancelAppointment(appointment.id, 'Cancelled from appointment details');
      setData(updated);
      toast.success(`${updated.pet.name}'s appointment was cancelled.`);
      setModal(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const { pet, vet, service } = appointment;

  return (
    <div className="appointment-detail">
      <Link to="/owner/appointments" className="back-link no-print">
        <FiArrowLeft aria-hidden="true" /> Appointments
      </Link>

      <div className="detail-header">
        <div className="detail-header-main">
          <div className="queue-badge is-large" aria-label={`Queue number ${appointment.queueNumber}`}>
            <small>Queue</small>
            <strong>{appointment.queueNumber}</strong>
          </div>
          <div>
            <span className="eyebrow">Booking reference</span>
            <h1 className="detail-ref mono">{appointment.reference}</h1>
            <StatusBadge status={appointment.status} />
          </div>
        </div>
        <div className="detail-actions no-print">
          {canOwnerRebook(appointment) && (
            <Button variant="brand" onClick={() => setModal('rebook')}>
              <FiRepeat aria-hidden="true" /> Rebook
            </Button>
          )}
          {canOwnerCancel(appointment) && (
            <Button variant="outline-danger" onClick={() => setModal('cancel')}>
              <FiXCircle aria-hidden="true" /> Cancel
            </Button>
          )}
          {isActive(appointment) && (
            <Button variant="soft" onClick={() => downloadAppointmentIcs(appointment)}>
              <FiDownload aria-hidden="true" /> Add to calendar
            </Button>
          )}
          <Button variant="soft" onClick={() => window.print()}>
            <FiPrinter aria-hidden="true" /> Print
          </Button>
        </div>
      </div>

      <ol className="timeline" aria-label="Appointment status">
        {getTimeline(appointment).map((step) => (
          <li key={step.label} className={`timeline-step is-${step.state}`}>
            <span className="timeline-dot" aria-hidden="true">
              {step.state === 'done' && <FiCheck />}
              {step.state === 'cancelled' && <FiXCircle />}
            </span>
            <span className="timeline-text">
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
          </li>
        ))}
      </ol>

      <Row className="g-4">
        <Col lg={7}>
          <div className="pc-card h-100">
            <div className="pc-card-body">
              <div className="detail-service">
                <PetAvatar species={pet.species} size={64} />
                <div>
                  <span className="eyebrow">Patient</span>
                  <h2 className="h3 mb-0">{pet.name}</h2>
                  <small className="text-muted-soft">{describePet(pet)}</small>
                </div>
              </div>
              <DetailList
                items={[
                  { icon: FiCalendar, label: 'Date', value: formatDateLong(appointment.date) },
                  { icon: FiClock, label: 'Time', value: `${formatTimeRange(appointment.startTime, appointment.endTime)} (10-minute slot)` },
                  { icon: FiClipboard, label: 'Reason', value: `${service.name} · ${CONSULTATION_TYPE}` },
                  { icon: FiDollarSign, label: 'Estimated fee', value: `from ${formatCurrency(appointment.price)}` },
                  { icon: FiFileText, label: 'Your notes', value: appointment.notes || 'No notes added' },
                  { icon: FiMapPin, label: 'Location', value: CLINIC_INFO.address },
                ]}
              />
              {pet.notes && <p className="pet-notes mt-3">Pet notes: {pet.notes}</p>}
              <p className="detail-stamp">
                {appointment.source} booking · last updated {formatTimestamp(appointment.updatedAt)}
              </p>
            </div>
          </div>
        </Col>
        <Col lg={5}>
          <div className="pc-card vet-mini h-100">
            <div className="pc-card-body">
              <h2 className="h5 mb-3">Your veterinarian</h2>
              <div className="vet-mini-row">
                <ImageWithFallback src={vet.photo} alt={formatVetName(vet)} icon={FaUserMd} className="vet-mini-photo" />
                <div>
                  <strong>{formatVetName(vet)}</strong>
                  <small>{vet.specialty}</small>
                </div>
              </div>
              {vet.name && (
                <Button as={Link} to={`/vets/${vet.id}`} variant="outline-ink" size="sm" className="mt-3 no-print">
                  View profile
                </Button>
              )}
              <div className="reminder-box">
                <strong>Before your visit</strong>
                <ul>
                  <li>Arrive 10 minutes early and show your queue number at the front desk.</li>
                  <li>Keep dogs on a leash and cats or small pets in a carrier.</li>
                  <li>Bring your pet’s vaccine card and any medicines they’re taking.</li>
                </ul>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {appointment.status === COMPLETED && (
        <div className="pc-card mt-4">
          <div className="pc-card-body">
            <div className="card-title-row">
              <h2>Medical record</h2>
              <span className="text-muted-soft small">{formatVetName(vet)}</span>
            </div>
            <MedicalRecordView record={appointment.medicalRecord} />
          </div>
        </div>
      )}

      <RebookModal appointment={appointment} show={modal === 'rebook'} onHide={() => setModal(null)} onRebooked={setData} />
      <ConfirmModal
        show={modal === 'cancel'}
        title="Cancel this appointment?"
        message={`${pet.name} · ${service.name} on ${formatDateLong(appointment.date)}. This can't be undone.`}
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
        icon={FiXCircle}
        busy={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
