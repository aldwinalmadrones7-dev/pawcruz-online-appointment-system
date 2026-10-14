/**
 * VetProfileForm — A veterinarian's own public profile and schedule (My profile → Vet profile
 * & schedule): specialty, PRC license, experience, photo, education, bio, days on duty and shift
 * hours. The shift decides which 10-minute slots pet owners can book. Name, email and mobile
 * come from the account details, so they are edited on the Personal info tab.
 */
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiExternalLink, FiSave } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAsync from '../hooks/useAsync';
import useForm from '../hooks/useForm';
import { getMyVetProfile, updateMyVetProfile } from '../services/vetService';
import { VET_SPECIALTIES, WEEKDAYS_MONDAY_FIRST } from '../utils/constants';
import { formatTime } from '../utils/formatters';
import { CLINIC_HOURS, minutesToTime, timeToMinutes } from '../utils/schedule';
import { validateVetProfile } from '../utils/validators';
import EmptyState from './EmptyState';
import FormField from './FormField';
import ImageWithFallback from './ImageWithFallback';
import LoadingSpinner from './LoadingSpinner';

// Half-hour choices inside clinic hours (9:00 AM – 7:00 PM).
const HOUR_OPTIONS = (() => {
  const options = [];
  for (let m = timeToMinutes(CLINIC_HOURS[1].open); m <= timeToMinutes(CLINIC_HOURS[1].close); m += 30) options.push(minutesToTime(m));
  return options;
})();

const profileValues = (vet) => ({
  specialty: vet.specialty ?? '',
  licenseNo: vet.licenseNo ?? '',
  yearsExperience: String(vet.yearsExperience ?? 0),
  photo: vet.photo ?? '',
  education: vet.education ?? '',
  availableDays: vet.availableDays ?? [],
  shiftStart: vet.shiftStart ?? '09:00',
  shiftEnd: vet.shiftEnd ?? '17:00',
  bio: vet.bio ?? '',
});

/** Adds the value to the list if missing, removes it if present. */
const toggleValue = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

function VetProfileFields({ vet, onSaved }) {
  const initial = profileValues(vet);
  const form = useForm(initial, validateVetProfile);
  const { values, errors, setFieldValue } = form;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);
  // Keep a specialty that isn't in the standard list (e.g. "General Practice & Surgery") selectable.
  const specialties = !vet.specialty || VET_SPECIALTIES.includes(vet.specialty) ? VET_SPECIALTIES : [vet.specialty, ...VET_SPECIALTIES];

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const saved = await updateMyVetProfile(formValues);
      toast.success('Your vet profile and schedule are saved. New hours apply to new bookings.');
      onSaved(saved);
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  return (
    <Form noValidate onSubmit={onSubmit}>
      {vet.availableDays.length ? (
        <p className="text-muted-soft small">
          Pet owners book you in 10-minute slots inside your shift.{' '}
          <Link to={`/vets/${vet.id}`}>
            View my public profile <FiExternalLink aria-hidden="true" />
          </Link>
        </p>
      ) : (
        <Alert variant="soft">
          <strong>Set your schedule to start receiving bookings.</strong> You appear on the website and in booking once you save at least one day on duty.
        </Alert>
      )}

      <Row className="g-3">
        <Col md={8}>
          <Row className="g-3">
            <Col sm={7}>
              <FormField label="Specialty" controlId="vet-specialty" required error={errors.specialty} className="mb-0">
                <Form.Select {...form.register('specialty')}>
                  <option value="">Choose a specialty…</option>
                  {specialties.map((specialty) => (
                    <option key={specialty}>{specialty}</option>
                  ))}
                </Form.Select>
              </FormField>
            </Col>
            <Col sm={5}>
              <FormField label="PRC license no." required placeholder="VET-01234" error={errors.licenseNo} className="mb-0" {...form.register('licenseNo')} />
            </Col>
            <Col sm={5}>
              <FormField label="Years of experience" type="number" min={0} max={60} required error={errors.yearsExperience} className="mb-0" {...form.register('yearsExperience')} />
            </Col>
            <Col sm={7}>
              <FormField
                label="Photo path"
                placeholder="/images/vet-9.jpg"
                hint="Put the photo in client/public/images and type its path here."
                className="mb-0"
                {...form.register('photo')}
              />
            </Col>
            <Col xs={12}>
              <FormField label="Education" placeholder="e.g. DVM, University of the Philippines Los Baños" className="mb-0" {...form.register('education')} />
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <div className="photo-preview">
            <ImageWithFallback src={values.photo} alt="Photo preview" icon={FaUserMd} ratio="4 / 5" />
          </div>
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
            placeholder="What pet owners should know about you"
            error={errors.bio}
            hint={`${values.bio.length}/600`}
            className="mb-0"
            {...form.register('bio')}
          />
        </Col>
      </Row>

      <div className="form-actions">
        <Button variant="soft" onClick={() => form.reset(initial)} disabled={!isDirty || form.submitting}>
          Discard changes
        </Button>
        <Button type="submit" variant="brand" disabled={!isDirty || form.submitting}>
          {form.submitting ? (
            <>
              <Spinner animation="border" size="sm" aria-hidden="true" /> Saving…
            </>
          ) : (
            <>
              <FiSave aria-hidden="true" /> Save profile & schedule
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}

export default function VetProfileForm() {
  const { data: vet, loading, error, reload, setData } = useAsync(() => getMyVetProfile(), []);

  if (loading && !vet) return <LoadingSpinner label="Loading your vet profile…" />;
  if (!vet) {
    return (
      <EmptyState
        compact
        title="We couldn't load your vet profile"
        message={error?.message}
        tone="accent"
        action={
          <Button variant="brand" onClick={reload}>
            Try again
          </Button>
        }
      />
    );
  }
  // A new key after saving starts the form fresh from the saved profile.
  return <VetProfileFields key={vet.updatedAt} vet={vet} onSaved={setData} />;
}
