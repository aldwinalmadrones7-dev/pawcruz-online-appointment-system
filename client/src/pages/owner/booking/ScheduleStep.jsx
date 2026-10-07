/**
 * ScheduleStep — Wizard step 2 (final-vet style): pick a date, then one of the open
 * 10-minute start times. A time is open when at least one vet is free for all your pets.
 */
import { Col, Row } from 'react-bootstrap';
import CalendarPicker from '../../../components/CalendarPicker';
import TimeSlotPicker from '../../../components/TimeSlotPicker';
import { getLastBookableDate } from '../../../utils/appointmentRules';
import { formatDateLong } from '../../../utils/formatters';

export default function ScheduleStep({ date, startTime, onDateChange, onTimeChange, slots, loading, error, unscheduled, isDateDisabled, petCount }) {
  return (
    <>
      <h2 className="step-title">When works for you?</h2>
      <p className="step-text">
        Open Monday–Sunday, 9:00 AM–7:00 PM. {petCount > 1 ? `Your ${petCount} pets will get back-to-back slots starting at the time you pick.` : 'Each visit is a 10-minute consultation slot.'}
      </p>
      <Row className="g-4">
        <Col md={6}>
          <h3 className="picker-heading">1. Choose a date</h3>
          <CalendarPicker value={date} onChange={onDateChange} isDateDisabled={isDateDisabled} maxDate={getLastBookableDate()} />
        </Col>
        <Col md={6}>
          <h3 className="picker-heading">2. Available time {date && <small>· {formatDateLong(date)}</small>}</h3>
          <TimeSlotPicker
            slots={slots}
            value={startTime}
            onChange={onTimeChange}
            loading={loading}
            error={error}
            emptyMessage={date && unscheduled ? 'No veterinarian is on duty that day. Please choose another date.' : 'Pick a date to see open times.'}
          />
        </Col>
      </Row>
    </>
  );
}
