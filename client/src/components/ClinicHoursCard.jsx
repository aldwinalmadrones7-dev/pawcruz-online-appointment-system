/**
 * ClinicHoursCard — Weekly opening hours with today's row highlighted (Manila time).
 */
import { FiClock } from 'react-icons/fi';
import { WEEKDAYS_MONDAY_FIRST } from '../utils/constants';
import { getManilaToday, getWeekday } from '../utils/dateUtils';
import { formatTime } from '../utils/formatters';
import { CLINIC_HOURS, SLOT_MINUTES } from '../utils/schedule';

export default function ClinicHoursCard({ className = '' }) {
  const todayIndex = getWeekday(getManilaToday());

  return (
    <div className={`pc-card hours-card ${className}`.trim()}>
      <div className="pc-card-body">
        <div className="hours-title">
          <span className="hours-icon" aria-hidden="true">
            <FiClock />
          </span>
          <div>
            <h3>Clinic hours</h3>
            <p>{SLOT_MINUTES}-minute appointment slots · walk-ins welcome</p>
          </div>
        </div>
        <ul className="hours-list">
          {WEEKDAYS_MONDAY_FIRST.map((day) => {
            const hours = CLINIC_HOURS[day.value];
            const isToday = day.value === todayIndex;
            return (
              <li key={day.value} className={isToday ? 'is-today' : ''}>
                <span>
                  {day.long}
                  {isToday && <em className="today-tag">Today</em>}
                </span>
                <strong className={hours ? '' : 'is-closed'}>{hours ? `${formatTime(hours.open)} – ${formatTime(hours.close)}` : 'Closed'}</strong>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
