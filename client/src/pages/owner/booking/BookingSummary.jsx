/**
 * BookingSummary — Sticky "Appointment Summary" sidebar (as in final-vet) that fills in
 * as the owner picks pets, reason, date, time and vet.
 */
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiClipboard, FiClock, FiHeart } from 'react-icons/fi';
import { SparkleIcon } from '../../../components/BrandIcons';
import { CONSULTATION_TYPE } from '../../../utils/constants';
import { formatCurrency, formatDateShort, formatTimeRange, formatVetName } from '../../../utils/formatters';
import { addMinutesToTime, SLOT_MINUTES } from '../../../utils/schedule';

export default function BookingSummary({ pets, service, date, startTime, vet }) {
  const rows = [
    { icon: FiHeart, label: pets.length > 1 ? 'Pets' : 'Pet', value: pets.length ? pets.map((pet) => pet.name).join(', ') : null },
    { icon: FiClipboard, label: 'Reason', value: service?.name },
    { icon: FiCalendar, label: 'Date', value: date ? formatDateShort(date) : null },
    {
      icon: FiClock,
      label: 'Time',
      value: startTime ? formatTimeRange(startTime, addMinutesToTime(startTime, SLOT_MINUTES * Math.max(1, pets.length))) : null,
    },
    { icon: FaUserMd, label: 'Veterinarian', value: vet ? formatVetName(vet) : null },
  ];

  return (
    <aside className="booking-summary" aria-label="Appointment summary">
      <SparkleIcon size={16} className="summary-spark" />
      <h2>Appointment summary</h2>
      <ul>
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className={value ? 'is-set' : ''}>
            <span className="summary-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>
              <small>{label}</small>
              <strong>{value ?? 'Not selected yet'}</strong>
            </span>
          </li>
        ))}
      </ul>
      <div className="summary-total">
        <span>
          {CONSULTATION_TYPE}
          <small>{SLOT_MINUTES}-minute slot per pet</small>
        </span>
        <strong>{service ? formatCurrency(service.price * Math.max(1, pets.length)) : '—'}</strong>
      </div>
      <p className="summary-note">Clinic hours: Monday–Sunday, 9:00 AM–7:00 PM. The last slot is 6:50–7:00 PM. A time disappears as soon as it is booked.</p>
    </aside>
  );
}
