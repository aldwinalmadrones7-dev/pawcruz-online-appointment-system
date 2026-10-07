/**
 * DayChips — Monday–Sunday chips showing which days a veterinarian is on duty.
 */
import { WEEKDAYS_MONDAY_FIRST } from '../utils/constants';

export default function DayChips({ days = [], size = 'sm' }) {
  return (
    <ul className={`day-chips is-${size}`} aria-label="Days on duty">
      {WEEKDAYS_MONDAY_FIRST.map((day) => {
        const active = days.includes(day.value);
        return (
          <li key={day.value} className={active ? 'is-active' : ''} title={`${day.long}: ${active ? 'on duty' : 'off'}`}>
            <span aria-hidden="true">{day.short}</span>
            <span className="visually-hidden">
              {day.long} {active ? 'on duty' : 'off'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
