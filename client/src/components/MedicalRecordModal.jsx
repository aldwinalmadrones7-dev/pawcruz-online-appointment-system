/**
 * MedicalRecordModal — The vet's view of one accepted visit: the patient, the owner's
 * notes and the pet's past visits on the left; on the right, the medical record form
 * ("Save record & complete") or, once completed, the saved record. Saving takes the vet to
 * Animal Patients with that pet's visit history open, so the new record is right there
 * (the live queue turns this off for all but the last pet of a multi-pet visit).
 */
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useForm from '../hooks/useForm';
import { completeAppointment } from '../services/appointmentService';
import { canComplete } from '../utils/appointmentRules';
import { APPOINTMENT_STATUS } from '../utils/constants';
import { addDaysToKey, getManilaToday } from '../utils/dateUtils';
import { describePet, formatDateLong, formatTimeRange, getFullName } from '../utils/formatters';
import { validateMedicalRecord } from '../utils/validators';
import FormField from './FormField';
import MedicalRecordView from './MedicalRecordView';
import PetAvatar from './PetAvatar';
import StatusBadge from './StatusBadge';
import VisitHistory from './VisitHistory';

const buildInitialValues = (appointment) => ({
  weight: appointment?.pet?.weight ? String(appointment.pet.weight) : '',
  temperature: '',
  diagnosis: '',
  treatment: '',
  prescription: '',
  followUpDate: '',
  remarks: '',
});

export default function MedicalRecordModal({ appointment, show, onHide, onCompleted, openPatientAfterSave = true }) {
  const navigate = useNavigate();
  const form = useForm(buildInitialValues(appointment), validateMedicalRecord);
  const { values, errors } = form;
  const isCompleted = appointment?.status === APPOINTMENT_STATUS.COMPLETED;
  const editable = Boolean(appointment) && canComplete(appointment);

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const saved = await completeAppointment(appointment.id, formValues);
      toast.success(`${saved.pet.name}'s visit is completed. The medical record is now in Animal Patients.`);
      onCompleted(saved);
      if (openPatientAfterSave) {
        onHide();
        navigate(`/vet/patients?pet=${saved.petId}`);
      }
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  if (!appointment) return null;
  const { pet, owner, service } = appointment;
  const counter = (name, max) => `${values[name].length}/${max}`;

  return (
    <Modal
      show={show}
      onHide={() => !form.submitting && onHide()}
      onShow={() => form.reset(buildInitialValues(appointment))}
      size="xl"
      centered
      scrollable
      aria-labelledby="medical-record-title"
    >
      <Form noValidate onSubmit={onSubmit}>
        <Modal.Header closeButton={!form.submitting}>
          <Modal.Title id="medical-record-title">{isCompleted ? 'Medical record' : 'Add medical record'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-4">
            <Col lg={5}>
              <div className="patient-head">
                <PetAvatar species={pet.species} size={56} />
                <div>
                  <h3 className="h5 mb-1">{pet.name}</h3>
                  <small className="text-muted-soft">{describePet(pet)}</small>
                </div>
              </div>
              <dl className="record-visit">
                <div>
                  <dt>Visit</dt>
                  <dd>
                    {formatDateLong(appointment.date)} · {formatTimeRange(appointment.startTime, appointment.endTime)}
                  </dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>{service.name}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>
                    {getFullName(owner)} · <span className="tabular">{owner.phone}</span>
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={appointment.status} /> <small className="text-muted-soft">Queue {appointment.queueNumber}</small>
                  </dd>
                </div>
              </dl>
              {appointment.notes && <p className="pet-notes">Owner&rsquo;s notes: {appointment.notes}</p>}
              {pet.notes && <p className="pet-notes">Pet notes: {pet.notes}</p>}

              <h4 className="h6 mt-4 mb-2">Previous visits</h4>
              <VisitHistory petId={pet.id} excludeId={appointment.id} emptyMessage="This is the first completed visit on record." />
            </Col>

            <Col lg={7}>
              {isCompleted ? (
                <MedicalRecordView record={appointment.medicalRecord} />
              ) : !editable ? (
                <p className="slot-empty">You can add the medical record and complete this visit on {formatDateLong(appointment.date)}.</p>
              ) : (
                <>
                  <Row className="g-3">
                    <Col sm={4}>
                      <FormField label="Weight (kg)" type="number" inputMode="decimal" step="0.01" min={0} max={150} error={errors.weight} className="mb-0" {...form.register('weight')} />
                    </Col>
                    <Col sm={4}>
                      <FormField label="Temperature (°C)" type="number" inputMode="decimal" step="0.1" min={30} max={45} placeholder="38.5" error={errors.temperature} className="mb-0" {...form.register('temperature')} />
                    </Col>
                    <Col sm={4}>
                      <FormField label="Follow-up date" type="date" min={addDaysToKey(getManilaToday(), 1)} error={errors.followUpDate} className="mb-0" {...form.register('followUpDate')} />
                    </Col>
                  </Row>
                  <FormField
                    label="Diagnosis"
                    as="textarea"
                    rows={2}
                    maxLength={500}
                    required
                    placeholder="What you found, e.g. Mild ear infection (left ear)"
                    error={errors.diagnosis}
                    hint={counter('diagnosis', 500)}
                    className="mt-3 mb-3"
                    {...form.register('diagnosis')}
                  />
                  <FormField
                    label="Treatment / procedure"
                    as="textarea"
                    rows={3}
                    maxLength={1000}
                    required
                    placeholder="What was done during the visit"
                    error={errors.treatment}
                    hint={counter('treatment', 1000)}
                    {...form.register('treatment')}
                  />
                  <FormField
                    label="Prescription"
                    as="textarea"
                    rows={2}
                    maxLength={500}
                    placeholder="Medicine, dose and how long (optional)"
                    error={errors.prescription}
                    hint={counter('prescription', 500)}
                    {...form.register('prescription')}
                  />
                  <FormField
                    label="Remarks for the owner"
                    as="textarea"
                    rows={2}
                    maxLength={500}
                    placeholder="Home care, diet or warning signs to watch (optional)"
                    error={errors.remarks}
                    hint={counter('remarks', 500)}
                    className="mb-0"
                    {...form.register('remarks')}
                  />
                </>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="soft" onClick={onHide} disabled={form.submitting}>
            Close
          </Button>
          {editable && (
            <Button type="submit" variant="brand" disabled={form.submitting}>
              {form.submitting ? (
                <>
                  <Spinner animation="border" size="sm" aria-hidden="true" /> Saving…
                </>
              ) : (
                <>
                  <FiCheckCircle aria-hidden="true" /> Save record &amp; complete
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
