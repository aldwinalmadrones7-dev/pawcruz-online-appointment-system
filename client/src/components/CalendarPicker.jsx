/**
 * CalendarPicker — Month calendar for picking an appointment date.
 * Past dates, dates beyond `maxDate` and anything `isDateDisabled` rejects
 * (days with no vet on duty) can't be selected.
 */
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getManilaToday, parseDateKey, toDateKey } from '../utils/dateUtils';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarPicker({ value, onChange, isDateDisabled, minDate, maxDate }) {
  const today = getManilaToday();
  const firstDate = minDate || today;
  const [month, setMonth] = useState(() => startOfMonth(parseDateKey(value || firstDate)));

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const canGoBack = month > startOfMonth(parseDateKey(firstDate));
  const canGoForward = !maxDate || addMonths(month, 1) <= parseDateKey(maxDate);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" className="calendar-nav" onClick={() => setMonth((m) => addMonths(m, -1))} disabled={!canGoBack} aria-label="Previous month">
          <FiChevronLeft aria-hidden="true" />
        </button>
        <h3 className="calendar-month" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </h3>
        <button type="button" className="calendar-nav" onClick={() => setMonth((m) => addMonths(m, 1))} disabled={!canGoForward} aria-label="Next month">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="calendar-weekday" aria-hidden="true">
            {label}
          </span>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const outside = !isSameMonth(day, month);
          const disabled = outside || key < firstDate || (maxDate && key > maxDate) || Boolean(isDateDisabled?.(key));
          const classes = [
            'calendar-day',
            outside ? 'is-outside' : '',
            key === today ? 'is-today' : '',
            key === value ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={key}
              type="button"
              className={classes}
              disabled={disabled}
              onClick={() => onChange(key)}
              aria-pressed={key === value}
              aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${disabled && !outside ? ' (unavailable)' : ''}`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <ul className="calendar-legend" aria-hidden="true">
        <li>
          <span className="legend-dot is-today" /> Today
        </li>
        <li>
          <span className="legend-dot is-selected" /> Selected
        </li>
        <li>
          <span className="legend-dot is-booked" /> Closed / day off
        </li>
      </ul>
    </div>
  );
}
