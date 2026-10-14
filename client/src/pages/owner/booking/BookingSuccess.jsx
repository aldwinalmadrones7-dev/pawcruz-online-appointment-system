/**
 * BookingSuccess — Confirmation screen after booking: queue number, booking reference
 * (copyable), each pet's slot, "add to calendar" download and next-step buttons.
 */
import { Button } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiCheck, FiClipboard, FiCopy, FiDownload, FiList, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SparkleIcon } from '../../../components/BrandIcons';
import DetailList from '../../../components/DetailList';
import PetAvatar from '../../../components/PetAvatar';
import StatusBadge from '../../../components/StatusBadge';
import { downloadAppointmentIcs } from '../../../utils/calendarFile';
import { formatDateLong, formatTimeRange, formatVetName } from '../../../utils/formatters';

export default function BookingSuccess({ booking, onBookAnother }) {
  const { reference, queueNumber, appointments } = booking;
  const first = appointments[0];

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success('Booking reference copied.');
    } catch {
      toast.info(`Your booking reference is ${reference}.`);
    }
  };

  return (
    <div className="booking-success">
      <div className="success-burst" aria-hidden="true">
        <span className="success-check">
          <FiCheck />
        </span>
        <SparkleIcon size={22} className="burst-spark spark-1" />
        <SparkleIcon size={14} className="burst-spark spark-2" />
        <SparkleIcon size={18} className="burst-spark spark-3" />
      </div>
      <h1 className="success-title">{appointments.length > 1 ? 'Appointments booked!' : 'Appointment booked!'}</h1>
      <p className="success-text">Your booking request is in. The clinic will accept it and assign it to your vet. You can follow its status under Appointments. Show your queue number at the front desk when you arrive.</p>

      <div className="queue-hero">
        <span>Your queue number</span>
        <strong>{queueNumber}</strong>
      </div>

      <div className="reference-box">
        <span>Booking reference</span>
        <strong className="mono">{reference}</strong>
        <button type="button" onClick={copyReference} className="copy-btn">
          <FiCopy aria-hidden="true" /> Copy
        </button>
      </div>

      <div className="success-details">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0">Visit details</h2>
          <StatusBadge status={first.status} />
        </div>
        <ul className="review-pets">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <PetAvatar species={appointment.pet.species} size={40} />
              <span>
                <strong>{appointment.pet.name}</strong>
                <small>{appointment.pet.breed || appointment.pet.species}</small>
              </span>
              <em>{formatTimeRange(appointment.startTime, appointment.endTime)}</em>
            </li>
          ))}
        </ul>
        <DetailList
          items={[
            { icon: FiCalendar, label: 'Date', value: formatDateLong(first.date) },
            { icon: FaUserMd, label: 'Veterinarian', value: formatVetName(first.vet) },
            { icon: FiClipboard, label: 'Reason', value: first.service.name },
          ]}
        />
      </div>

      <div className="success-actions">
        <Button variant="brand" onClick={() => downloadAppointmentIcs(appointments)}>
          <FiDownload aria-hidden="true" /> Add to calendar
        </Button>
        <Button as={Link} to="/owner/appointments" variant="ink">
          <FiList aria-hidden="true" /> My appointments
        </Button>
        <Button variant="outline-ink" onClick={onBookAnother}>
          <FiPlus aria-hidden="true" /> Book another
        </Button>
      </div>
    </div>
  );
}
