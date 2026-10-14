/**
 * AppointmentFormModal — Admin form, final-vet style.
 * New: register a walk-in (or phone) visit for one or more of an owner's pets —
 *      owner → pets → reason → date → open time → free vet.
 * Edit: change one appointment's reason, notes, source, status and (if upcoming) its schedule.
 * Only the assigned vet can complete a visit (with its medical record), so "Completed" is
 * never offered here, and a completed visit's status is locked.
 */
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAsync from '../hooks/useAsync';
import useAvailability from '../hooks/useAvailability';
import useForm from '../hooks/useForm';
import { createAppointment, updateAppointment } from '../services/appointmentService';
import { getOwners } from '../services/patientService';
import { getPets } from '../services/petService';
import { getLastBookableDate, isActive } from '../utils/appointmentRules';
import { APPOINTMENT_SOURCES, APPOINTMENT_STATUS, APPOINTMENT_STATUSES, MAX_PETS_PER_VISIT } from '../utils/constants';
import { isDateTimePast } from '../utils/dateUtils';
import { describePet, formatDateLong, formatTimeRange, getFullName } from '../utils/formatters';
import { isVetOnDuty } from '../utils/schedule';
import { validateAppointmentForm } from '../utils/validators';
import CalendarPicker from './CalendarPicker';
import FormField from './FormField';
import PetAvatar from './PetAvatar';
import TimeSlotPicker from './TimeSlotPicker';
import VetPicker from './VetPicker';

function buildInitialValues(appointment, services = []) {
  return {
    ownerId: appointment?.ownerId ?? '',
    petIds: appointment ? [appointment.petId] : [],
    serviceId: appointment?.serviceId ?? services[0]?.id ?? '', // new visits default to the first service
    date: appointment?.date ?? '',
    startTime: appointment?.startTime ?? '',
    vetId: appointment?.vetId ?? '',
    source: appointment?.source ?? 'Walk-In',
    status: appointment?.status ?? APPOINTMENT_STATUS.CONFIRMED,
    notes: appointment?.notes ?? '',
  };
}

export default function AppointmentFormModal({ show, appointment, services, vets, onHide, onSaved }) {
  const isEdit = Boolean(appointment);
  const scheduleLocked = isEdit && (!isActive(appointment) || isDateTimePast(appointment.date, appointment.startTime));
  const isCompleted = appointment?.status === APPOINTMENT_STATUS.COMPLETED;
  const statusOptions = isCompleted ? [APPOINTMENT_STATUS.COMPLETED] : APPOINTMENT_STATUSES.filter((status) => status !== APPOINTMENT_STATUS.COMPLETED);
  const validate = (values) => validateAppointmentForm(values, { isEdit, scheduleLocked });
  const form = useForm(buildInitialValues(appointment, services), validate);
  const { values, errors, setFieldValue, setValues } = form;

  const { data: owners } = useAsync(() => (show && !isEdit ? getOwners() : Promise.resolve(null)), [show, isEdit]);
  const { data: ownerPets } = useAsync(() => (values.ownerId && !isEdit ? getPets({ ownerId: values.ownerId }) : Promise.resolve([])), [values.ownerId, isEdit]);
  const availability = useAvailability({
    date: show && !scheduleLocked ? values.date : '',
    petIds: values.petIds,
    excludeAppointmentId: appointment?.id ?? null,
  });
  const freeVets = availability.vets.filter((vet) => availability.slotMap[vet.id]?.includes(values.startTime));

  // Changing an earlier choice clears the choices that depend on it.
  const changeOwner = (event) => setValues((current) => ({ ...current, ownerId: event.target.value, petIds: [], startTime: '', vetId: '' }));
  const togglePet = (petId) =>
    setValues((current) => {
      const has = current.petIds.includes(petId);
      if (!has && current.petIds.length >= MAX_PETS_PER_VISIT) return current;
      return { ...current, petIds: has ? current.petIds.filter((id) => id !== petId) : [...current.petIds, petId], startTime: '', vetId: '' };
    });
  const changeDate = (date) => setValues((current) => ({ ...current, date, startTime: '', vetId: '' }));
  const changeTime = (startTime) =>
    setValues((current) => ({ ...current, startTime, vetId: availability.slotMap[current.vetId]?.includes(startTime) ? current.vetId : '' }));

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      if (isEdit) {
        const saved = await updateAppointment(appointment.id, formValues);
        toast.success(`${saved.pet.name}'s appointment was updated.`);
        onSaved([saved]);
      } else {
        const result = await createAppointment(formValues);
        toast.success(`${formValues.source} visit registered — queue ${result.queueNumber}, reference ${result.reference}.`);
        onSaved(result.appointments);
      }
      onHide();
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
      if (err.status === 409) availability.reload();
    }
  });

  return (
    <Modal
      show={show}
      onHide={() => !form.submitting && onHide()}
      onShow={() => form.reset(buildInitialValues(appointment, services))}
      size="xl"
      centered
      scrollable
      aria-labelledby="appointment-form-title"
    >
      <Form noValidate onSubmit={onSubmit}>
        <Modal.Header closeButton={!form.submitting}>
          <Modal.Title id="appointment-form-title">{isEdit ? `Edit appointment ${appointment.reference}` : 'Register a visit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-4">
            <Col lg={4}>
              {isEdit ? (
                <div className="edit-pet-head">
                  <PetAvatar species={appointment.pet.species} size={48} />
                  <div>
                    <strong>{appointment.pet.name}</strong>
                    <small>
                      {describePet(appointment.pet)} · owner {getFullName(appointment.owner)}
                    </small>
                  </div>
                </div>
              ) : (
                <>
                  <FormField label="Pet owner" controlId="appt-owner" required error={errors.ownerId}>
                    <Form.Select name="ownerId" value={values.ownerId} onChange={changeOwner} isInvalid={Boolean(errors.ownerId)} disabled={!owners}>
                      <option value="">{owners ? 'Choose a pet owner…' : 'Loading owners…'}</option>
                      {(owners ?? []).map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {getFullName(owner)} · {owner.phone} ({owner.petCount} pet{owner.petCount === 1 ? '' : 's'})
                        </option>
                      ))}
                    </Form.Select>
                  </FormField>
                  <fieldset className="mb-3">
                    <legend className="form-label">
                      Pets <span className="required-mark" aria-hidden="true">*</span>
                    </legend>
                    {!values.ownerId ? (
                      <p className="slot-empty">Choose an owner to see their pets.</p>
                    ) : (ownerPets ?? []).length ? (
                      <div className="pet-checklist">
                        {ownerPets.map((pet) => (
                          <label key={pet.id} className={`pet-check-row${values.petIds.includes(pet.id) ? ' is-on' : ''}`}>
                            <input type="checkbox" name="petIds" checked={values.petIds.includes(pet.id)} onChange={() => togglePet(pet.id)} />
                            <PetAvatar species={pet.species} size={30} />
                            <span>
                              <strong>{pet.name}</strong>
                              <small>{describePet(pet)}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="slot-empty">This owner has no pets yet. They can add pets in their account.</p>
                    )}
                    {errors.petIds && <div className="invalid-feedback d-block">{errors.petIds}</div>}
                  </fieldset>
                </>
              )}

              <FormField label="Reason for visit" controlId="appt-reason" required error={errors.serviceId}>
                <Form.Select {...form.register('serviceId')}>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Form.Select>
              </FormField>

              <Row className="g-3">
                <Col xs={isEdit ? 6 : 12}>
                  <FormField label="Source" controlId="appt-source" required error={errors.source} className="mb-0">
                    <Form.Select {...form.register('source')}>
                      {APPOINTMENT_SOURCES.map((source) => (
                        <option key={source}>{source}</option>
                      ))}
                    </Form.Select>
                  </FormField>
                </Col>
                {isEdit && (
                  <Col xs={6}>
                    <FormField label="Status" controlId="appt-status" required error={errors.status} className="mb-0">
                      <Form.Select {...form.register('status')} disabled={isCompleted}>
                        {statusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </Form.Select>
                    </FormField>
                  </Col>
                )}
              </Row>

              <FormField
                label="Notes"
                as="textarea"
                rows={3}
                maxLength={500}
                placeholder="Symptoms, concerns or front-desk notes"
                error={errors.notes}
                hint={`${values.notes.length}/500`}
                className="mt-3"
                {...form.register('notes')}
              />
            </Col>

            <Col lg={8}>
              {scheduleLocked ? (
                <div className="locked-schedule">
                  <FiLock aria-hidden="true" />
                  <div>
                    <strong>
                      {formatDateLong(appointment.date)} · {formatTimeRange(appointment.startTime, appointment.endTime)}
                    </strong>
                    <span>This visit is past or no longer active, so its schedule can’t change. You can still update the details on the left.</span>
                  </div>
                </div>
              ) : (
                <Row className="g-3">
                  <Col md={6}>
                    <h3 className="picker-heading">Date</h3>
                    <CalendarPicker value={values.date} onChange={changeDate} isDateDisabled={(key) => !vets.some((vet) => isVetOnDuty(vet, key))} maxDate={getLastBookableDate()} />
                    {errors.date && <div className="invalid-feedback d-block">{errors.date}</div>}
                  </Col>
                  <Col md={6}>
                    <h3 className="picker-heading">Available time {values.petIds.length > 1 && <small>· {values.petIds.length} back-to-back slots</small>}</h3>
                    <TimeSlotPicker
                      slots={availability.slots}
                      value={values.startTime}
                      onChange={changeTime}
                      loading={availability.loading}
                      error={availability.error}
                      emptyMessage={values.date && availability.unscheduled ? 'No veterinarian is on duty that day.' : 'Pick a date to see open times.'}
                    />
                    {errors.startTime && <div className="invalid-feedback d-block">{errors.startTime}</div>}
                    <h3 className="picker-heading mt-3">Veterinarian</h3>
                    <VetPicker vets={values.startTime ? freeVets : []} value={values.vetId} onChange={(vetId) => setFieldValue('vetId', vetId)} />
                    {errors.vetId && <div className="invalid-feedback d-block">{errors.vetId}</div>}
                  </Col>
                </Row>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="soft" onClick={onHide} disabled={form.submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={form.submitting}>
            {form.submitting ? (
              <>
                <Spinner animation="border" size="sm" aria-hidden="true" /> Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Register visit'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
