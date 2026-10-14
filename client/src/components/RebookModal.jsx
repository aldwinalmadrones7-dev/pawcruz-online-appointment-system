/**
 * RebookModal — Moves one pet's upcoming visit to a new date, time and/or vet
 * (final-vet's "Rebook"): choose a date, an open 10-minute time, then a vet free at that time.
 */
import { useState } from 'react';
import { Button, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAsync from '../hooks/useAsync';
import useAvailability from '../hooks/useAvailability';
import { rescheduleAppointment } from '../services/appointmentService';
import { getVets } from '../services/vetService';
import { getLastBookableDate } from '../utils/appointmentRules';
import { APPOINTMENT_STATUS } from '../utils/constants';
import { formatDateLong, formatDateShort, formatTime, formatVetName } from '../utils/formatters';
import { isVetOnDuty } from '../utils/schedule';
import CalendarPicker from './CalendarPicker';
import TimeSlotPicker from './TimeSlotPicker';
import VetPicker from './VetPicker';

export default function RebookModal({ appointment, show, onHide, onRebooked }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vetId, setVetId] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: allVets } = useAsync(() => getVets(), []);
  const availability = useAvailability({
    date: show ? date : '',
    petIds: appointment ? [appointment.petId] : [],
    excludeAppointmentId: appointment?.id ?? null,
  });
  const freeVets = availability.vets.filter((vet) => availability.slotMap[vet.id]?.includes(time));

  const resetForm = () => {
    setDate('');
    setTime('');
    setVetId('');
  };

  const changeDate = (key) => {
    setDate(key);
    setTime('');
    setVetId('');
  };

  const changeTime = (value) => {
    setTime(value);
    if (!availability.slotMap[vetId]?.includes(value)) setVetId('');
  };

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await rescheduleAppointment(appointment.id, { date, startTime: time, vetId });
      const awaiting = updated.status === APPOINTMENT_STATUS.PENDING ? ' The clinic will confirm the new time.' : '';
      toast.success(`${updated.pet.name} is rebooked for ${formatDateShort(date)} at ${formatTime(time)} (queue ${updated.queueNumber}).${awaiting}`);
      onRebooked(updated);
      onHide();
    } catch (err) {
      toast.error(err.message);
      if (err.status === 409) {
        setTime('');
        setVetId('');
        availability.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={() => !saving && onHide()} onExited={resetForm} centered size="xl" scrollable aria-labelledby="rebook-title">
      <Modal.Header closeButton={!saving}>
        <Modal.Title id="rebook-title">Rebook appointment</Modal.Title>
      </Modal.Header>
      {appointment && (
        <Modal.Body>
          <div className="reschedule-current">
            <FiCalendar aria-hidden="true" />
            <div>
              <strong>
                {appointment.pet.name} · {appointment.service.name}
              </strong>
              <span>
                Currently {formatDateLong(appointment.date)} at {formatTime(appointment.startTime)} with {formatVetName(appointment.vet)} ·{' '}
                <span className="mono">{appointment.reference}</span>
              </span>
            </div>
          </div>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <h3 className="picker-heading">1. New date</h3>
              <CalendarPicker
                value={date}
                onChange={changeDate}
                isDateDisabled={(key) => !(allVets ?? []).some((vet) => isVetOnDuty(vet, key))}
                maxDate={getLastBookableDate()}
              />
            </Col>
            <Col lg={4} md={6}>
              <h3 className="picker-heading">2. Available time</h3>
              <TimeSlotPicker
                slots={availability.slots}
                value={time}
                onChange={changeTime}
                loading={availability.loading}
                error={availability.error}
                emptyMessage={date && availability.unscheduled ? 'No veterinarian is on duty that day.' : 'Pick a date to see open times.'}
              />
            </Col>
            <Col lg={4}>
              <h3 className="picker-heading">3. Veterinarian</h3>
              <VetPicker vets={time ? freeVets : []} value={vetId} onChange={setVetId} />
            </Col>
          </Row>
        </Modal.Body>
      )}
      <Modal.Footer>
        <Button variant="soft" onClick={onHide} disabled={saving}>
          Keep current schedule
        </Button>
        <Button variant="brand" onClick={handleSave} disabled={!date || !time || !vetId || saving}>
          {saving ? (
            <>
              <Spinner animation="border" size="sm" aria-hidden="true" /> Rebooking…
            </>
          ) : (
            'Confirm rebook'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
