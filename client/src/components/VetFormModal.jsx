/**
 * VetFormModal — Admin form to add or edit a veterinarian: profile, PRC license,
 * days on duty, shift hours, a photo path with live preview, and the vet's login password
 * (they sign in with their email to see accepted visits and write medical records).
 */
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { toast } from 'react-toastify';
import useForm from '../hooks/useForm';
import { createVet, updateVet } from '../services/vetService';
import { VET_SPECIALTIES, WEEKDAYS_MONDAY_FIRST } from '../utils/constants';
import { formatTime, formatVetName } from '../utils/formatters';
import { CLINIC_HOURS, minutesToTime, timeToMinutes } from '../utils/schedule';
import { sanitizePhoneInput, validateVet } from '../utils/validators';
import FormField from './FormField';
import ImageWithFallback from './ImageWithFallback';
import PasswordInput from './PasswordInput';

// Half-hour choices inside clinic hours (9:00 AM – 7:00 PM).
const HOUR_OPTIONS = (() => {
  const options = [];
  for (let m = timeToMinutes(CLINIC_HOURS[1].open); m <= timeToMinutes(CLINIC_HOURS[1].close); m += 30) options.push(minutesToTime(m));
  return options;
})();

function buildInitialValues(vet) {
  return {
    name: vet?.name ?? '',
    specialty: vet?.specialty ?? '',
    licenseNo: vet?.licenseNo ?? '',
    email: vet?.email ?? '',
    phone: vet?.phone ?? '',
    yearsExperience: vet ? String(vet.yearsExperience) : '',
    photo: vet?.photo ?? '/images/vet-1.jpg',
    education: vet?.education ?? '',
    availableDays: vet?.availableDays ?? [],
    shiftStart: vet?.shiftStart ?? '09:00',
    shiftEnd: vet?.shiftEnd ?? '14:00',
    bio: vet?.bio ?? '',
    password: '',
  };
}

/** Adds the value to the list if missing, removes it if present. */
const toggleValue = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

export default function VetFormModal({ show, vet, onHide, onSaved }) {
  const isEdit = Boolean(vet);
  const form = useForm(buildInitialValues(vet), (values) => validateVet(values, { isEdit }));
  const { values, errors, setFieldValue } = form;

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const saved = isEdit ? await updateVet(vet.id, formValues) : await createVet(formValues);
      toast.success(isEdit ? `${formatVetName(saved)} updated.` : `${formatVetName(saved)} joined the team.`);
      onSaved(saved);
      onHide();
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  return (
    <Modal
      show={show}
      onHide={() => !form.submitting && onHide()}
      onShow={() => form.reset(buildInitialValues(vet))}
      size="lg"
      centered
      scrollable
      aria-labelledby="vet-form-title"
    >
      <Form noValidate onSubmit={onSubmit}>
        <Modal.Header closeButton={!form.submitting}>
          <Modal.Title id="vet-form-title">{isEdit ? `Edit ${formatVetName(vet)}` : 'Add a veterinarian'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={8}>
              <FormField label="Full name" required placeholder="e.g. Maria Santos (no “Dr.”)" error={errors.name} {...form.register('name')} />
              <Row className="g-3">
                <Col sm={7}>
                  <FormField label="Specialty" controlId="vet-specialty" required error={errors.specialty} className="mb-0">
                    <Form.Select {...form.register('specialty')}>
                      <option value="">Choose a specialty…</option>
                      {VET_SPECIALTIES.map((specialty) => (
                        <option key={specialty}>{specialty}</option>
                      ))}
                    </Form.Select>
                  </FormField>
                </Col>
                <Col sm={5}>
                  <FormField label="PRC license no." required placeholder="VET-01234" error={errors.licenseNo} className="mb-0" {...form.register('licenseNo')} />
                </Col>
              </Row>
            </Col>
            <Col md={4}>
              <div className="photo-preview">
                <ImageWithFallback src={values.photo} alt="Photo preview" icon={FaUserMd} ratio="4 / 5" />
              </div>
            </Col>
            <Col md={6}>
              <FormField label="Email" type="email" required placeholder="name@pawcruz.ph" hint="Also the vet’s login." error={errors.email} {...form.register('email')} />
            </Col>
            <Col md={6}>
              <FormField
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                required
                placeholder="09XXXXXXXXX"
                error={errors.phone}
                {...form.register('phone')}
                onChange={(event) => setFieldValue('phone', sanitizePhoneInput(event.target.value))}
              />
            </Col>
            <Col md={4}>
              <FormField label="Years of experience" type="number" min={0} max={60} required error={errors.yearsExperience} {...form.register('yearsExperience')} />
            </Col>
            <Col md={8}>
              <FormField label="Photo path" placeholder="/images/vet-9.jpg" hint="Put the photo in client/public/images and type its path here." {...form.register('photo')} />
            </Col>
            <Col md={6}>
              <FormField
                label={isEdit ? 'New login password' : 'Login password'}
                controlId="vet-password"
                required={!isEdit}
                error={errors.password}
                hint={isEdit ? 'Leave blank to keep the current password.' : 'At least 8 characters with an uppercase letter and a number.'}
              >
                <PasswordInput autoComplete="new-password" placeholder={isEdit ? 'Unchanged' : 'Set a password'} {...form.register('password')} />
              </FormField>
            </Col>
            <Col xs={12}>
              <FormField label="Education" placeholder="e.g. DVM, University of the Philippines Los Baños" {...form.register('education')} />
            </Col>

            <Col xs={12}>
              <fieldset className="mb-1">
                <legend className="form-label">
                  Days on duty <span className="required-mark" aria-hidden="true">*</span>
                </legend>
                <div className="toggle-chips">
                  {WEEKDAYS_MONDAY_FIRST.map((day) => (
                    <label key={day.value} className={`toggle-chip${values.availableDays.includes(day.value) ? ' is-on' : ''}`}>
                      <input
                        type="checkbox"
                        name="availableDays"
                        className="visually-hidden"
                        checked={values.availableDays.includes(day.value)}
                        onChange={() => setFieldValue('availableDays', toggleValue(values.availableDays, day.value))}
                      />
                      {day.short}
                    </label>
                  ))}
                </div>
                {errors.availableDays && <div className="invalid-feedback d-block">{errors.availableDays}</div>}
              </fieldset>
            </Col>
            <Col sm={6}>
              <FormField label="Shift starts" controlId="vet-shift-start" required className="mb-0">
                <Form.Select {...form.register('shiftStart')}>
                  {HOUR_OPTIONS.slice(0, -1).map((time) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </Form.Select>
              </FormField>
            </Col>
            <Col sm={6}>
              <FormField label="Shift ends" controlId="vet-shift-end" required error={errors.shiftEnd} className="mb-0">
                <Form.Select {...form.register('shiftEnd')}>
                  {HOUR_OPTIONS.slice(1).map((time) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </Form.Select>
              </FormField>
            </Col>

            <Col xs={12}>
              <FormField
                label="Short bio"
                as="textarea"
                rows={3}
                maxLength={600}
                required
                placeholder="What pet owners should know about this vet"
                error={errors.bio}
                hint={`${values.bio.length}/600`}
                className="mb-0"
                {...form.register('bio')}
              />
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
              'Add veterinarian'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
