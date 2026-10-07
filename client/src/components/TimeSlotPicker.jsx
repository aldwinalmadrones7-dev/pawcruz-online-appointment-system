/**
 * TimeSlotPicker — The day's 10-minute start times (final-vet style), grouped into
 * morning, afternoon and evening. A time is open when at least one vet is free then;
 * taken, past and clashing times are shown but disabled.
 */
import { Alert } from 'react-bootstrap';
import { formatTime, formatTimeRange } from '../utils/formatters';

const REASON_LABELS = {
  booked: 'Full',
  past: 'Passed',
  conflict: 'Pet booked',
};

const PERIODS = [
  { label: 'Morning', test: (time) => time < '12:00' },
  { label: 'Afternoon', test: (time) => time >= '12:00' && time < '17:00' },
  { label: 'Evening', test: (time) => time >= '17:00' },
];

export default function TimeSlotPicker({ slots, value, onChange, loading = false, error = null, emptyMessage = 'Pick a date to see open times.' }) {
  if (error) return <Alert variant="danger">{error}</Alert>;

  if (loading && !slots.length) {
    return (
      <div className="slot-grid is-skeleton" aria-busy="true" aria-label="Loading time slots">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="slot-skeleton" />
        ))}
      </div>
    );
  }

  if (!slots.length) return <p className="slot-empty">{emptyMessage}</p>;

  const openCount = slots.filter((slot) => slot.available).length;
  const groups = PERIODS.map((period) => ({ label: period.label, items: slots.filter((slot) => period.test(slot.time)) })).filter((group) => group.items.length);

  return (
    <div className={`slot-picker${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
      <p className="slot-summary" aria-live="polite">
        {openCount ? `${openCount} open time${openCount === 1 ? '' : 's'} · 10-minute slots` : 'Fully booked — please try another day.'}
      </p>
      <div className="slot-scroll">
        {groups.map((group) => (
          <fieldset key={group.label} className="slot-group">
            <legend>{group.label}</legend>
            <div className="slot-grid">
              {group.items.map((slot) => {
                const selected = slot.time === value;
                const vets = slot.vetIds?.length ?? 0;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    className={`slot-btn${selected ? ' is-selected' : ''}${slot.available ? '' : ` is-${slot.reason}`}`}
                    disabled={!slot.available}
                    onClick={() => onChange(slot.time)}
                    aria-pressed={selected}
                    title={slot.available ? `${formatTimeRange(slot.time, slot.end)} · ${vets} vet${vets === 1 ? '' : 's'} free` : REASON_LABELS[slot.reason]}
                  >
                    <span className="slot-time">{formatTime(slot.time)}</span>
                    {!slot.available && <span className="slot-reason">{REASON_LABELS[slot.reason]}</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <ul className="slot-legend" aria-label="Legend">
        <li>
          <span className="legend-dot is-open" /> Open
        </li>
        <li>
          <span className="legend-dot is-selected" /> Selected
        </li>
        <li>
          <span className="legend-dot is-booked" /> Unavailable
        </li>
      </ul>
    </div>
  );
}
