/**
 * AppointmentCard — Compact appointment summary for the mobile list view (pet,
 * reference, queue number, status, date/time, vet, reason and optional owner), with action buttons.
 */
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiClock, FiFileText, FiUser } from 'react-icons/fi';
import { formatDateShort, formatTimeRange, formatVetName, getFullName } from '../utils/formatters';
import PetAvatar from './PetAvatar';
import StatusBadge from './StatusBadge';

export default function AppointmentCard({ appointment, actions, showOwner = false }) {
  const { pet, vet, owner, service } = appointment;
  return (
    <article className="appointment-card">
      <header className="appointment-card-head">
        <span className="ref-code mono">{appointment.reference}</span>
        <StatusBadge status={appointment.status} />
      </header>
      <div className="appointment-card-pet">
        <PetAvatar species={pet.species} size={40} />
        <div>
          <h3 className="appointment-card-title">{pet.name}</h3>
          <small>
            Queue {appointment.queueNumber} · {appointment.source}
          </small>
        </div>
      </div>
      <ul className="appointment-meta">
        <li>
          <FiCalendar aria-hidden="true" /> {formatDateShort(appointment.date)}
        </li>
        <li>
          <FiClock aria-hidden="true" /> {formatTimeRange(appointment.startTime, appointment.endTime)}
        </li>
        <li>
          <FaUserMd aria-hidden="true" /> {formatVetName(vet)}
        </li>
        <li>
          <FiFileText aria-hidden="true" /> {service.name}
        </li>
        {showOwner && (
          <li>
            <FiUser aria-hidden="true" /> {getFullName(owner)}
          </li>
        )}
      </ul>
      {actions && <footer className="appointment-card-actions">{actions}</footer>}
    </article>
  );
}
