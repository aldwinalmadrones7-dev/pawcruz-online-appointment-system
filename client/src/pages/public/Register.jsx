/**
 * Register — Create an account as a pet owner or a veterinarian (chosen at the top), with full
 * validation: names, email, PH mobile number, strong password + live checklist, confirm password
 * and data privacy consent. Veterinarians also give their PRC license, specialty and the clinic's
 * veterinarian sign-up code. New accounts are logged in right away; /register?role=vet preselects
 * the veterinarian account.
 */
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCheckCircle, FiUserPlus } from 'react-icons/fi';
import { LuPawPrint } from 'react-icons/lu';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../../components/FormField';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { ROLES, VET_SPECIALTIES } from '../../utils/constants';
import { getPostLoginPath } from '../../utils/routes';
import { sanitizePhoneInput, validateRegister } from '../../utils/validators';
import AuthLayout from './AuthLayout';

const ACCOUNT_TYPES = [
  { role: ROLES.OWNER, icon: LuPawPrint, title: 'Pet owner', text: 'Book visits, manage your pets and see your place in the queue.' },
  { role: ROLES.VET, icon: FaUserMd, title: 'Veterinarian', text: 'Run your live queue, check pets in and set your schedule.' },
];

const INITIAL_VALUES = {
  role: ROLES.OWNER,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  licenseNo: '',
  specialty: '',
  clinicCode: '',
  password: '',
  confirmPassword: '',
  agree: false,
};

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from;
  const form = useForm({ ...INITIAL_VALUES, role: searchParams.get('role') === ROLES.VET ? ROLES.VET : ROLES.OWNER }, validateRegister);
  const { values, errors } = form;
  const isVet = values.role === ROLES.VET;

  if (user) return <Navigate to={getPostLoginPath(user, from)} replace />;

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const created = await register(formValues);
      if (created.role === ROLES.VET) {
        toast.success(`Welcome to PawCruz, Dr. ${created.lastName}! Set your duty days and shift so pet owners can book you.`);
        navigate('/vet/profile?tab=schedule', { replace: true });
      } else {
        toast.success(`Welcome to PawCruz, ${created.firstName}! Add your pets to start booking.`);
        navigate(getPostLoginPath(created, from), { replace: true });
      }
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle={isVet ? 'For PawCruz veterinarians. You’ll set your duty days right after signing up.' : 'It’s free and takes less than a minute.'}
      wide
    >
      <Form noValidate onSubmit={onSubmit} className="auth-fields">
        <fieldset className="role-choice">
          <legend className="form-label">
            Account type <span className="required-mark" aria-hidden="true">*</span>
          </legend>
          {ACCOUNT_TYPES.map(({ role, icon: Icon, title, text }) => (
            <label key={role} className={`role-option${values.role === role ? ' is-on' : ''}`}>
              <input type="radio" name="role" value={role} checked={values.role === role} onChange={form.handleChange} className="visually-hidden" />
              <span className="role-option-icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="role-option-text">
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
              <FiCheckCircle className="role-option-check" aria-hidden="true" />
            </label>
          ))}
          {errors.role && <div className="invalid-feedback d-block">{errors.role}</div>}
        </fieldset>

        <Row className="gx-3">
          <Col xs={6}>
            <FormField label="First name" required autoComplete="given-name" placeholder="Juan" error={errors.firstName} {...form.register('firstName')} />
          </Col>
          <Col xs={6}>
            <FormField label="Last name" required autoComplete="family-name" placeholder="Dela Cruz" error={errors.lastName} {...form.register('lastName')} />
          </Col>
          <Col xs={6}>
            <FormField label="Email" type="email" required autoComplete="email" placeholder="you@email.com" error={errors.email} {...form.register('email')} />
          </Col>
          <Col xs={6}>
            <FormField
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              error={errors.phone}
              {...form.register('phone')}
              onChange={(event) => form.setFieldValue('phone', sanitizePhoneInput(event.target.value))}
            />
          </Col>
        </Row>

        {isVet && (
          <div className="vet-signup-fields">
            <Row className="gx-3">
              <Col xs={6}>
                <FormField label="PRC license no." required autoComplete="off" placeholder="e.g. 0012345" error={errors.licenseNo} {...form.register('licenseNo')} />
              </Col>
              <Col xs={6}>
                <FormField label="Specialty" controlId="register-specialty" required error={errors.specialty}>
                  <Form.Select {...form.register('specialty')}>
                    <option value="">Choose…</option>
                    {VET_SPECIALTIES.map((specialty) => (
                      <option key={specialty}>{specialty}</option>
                    ))}
                  </Form.Select>
                </FormField>
              </Col>
              <Col xs={12}>
                <FormField
                  label="Clinic sign-up code"
                  required
                  autoComplete="off"
                  placeholder="Given to you by the clinic"
                  hint="Only PawCruz veterinarians get this code — it protects pet owners’ records."
                  error={errors.clinicCode}
                  {...form.register('clinicCode')}
                />
              </Col>
            </Row>
          </div>
        )}

        <Row className="gx-3">
          <Col xs={6}>
            <FormField label="Password" controlId="register-password" required error={errors.password}>
              <PasswordInput autoComplete="new-password" placeholder="Create a password" aria-required="true" {...form.register('password')} />
            </FormField>
          </Col>
          <Col xs={6}>
            <FormField label="Confirm password" controlId="register-confirm" required error={errors.confirmPassword}>
              <PasswordInput autoComplete="new-password" placeholder="Type it again" aria-required="true" {...form.register('confirmPassword')} />
            </FormField>
          </Col>
        </Row>
        <PasswordChecklist password={values.password} />

        <Form.Group className="auth-consent" controlId="register-agree">
          <Form.Check
            type="checkbox"
            name="agree"
            checked={values.agree}
            onChange={form.handleChange}
            isInvalid={Boolean(errors.agree)}
            label={
              <>
                I agree to the <strong>PawCruz Privacy Notice</strong> and the processing of my personal information under the Data Privacy Act of
                2012 (RA 10173).
              </>
            }
          />
          {errors.agree && <div className="invalid-feedback d-block">{errors.agree}</div>}
        </Form.Group>

        <Button type="submit" variant="brand" size="lg" className="w-100" disabled={form.submitting}>
          {form.submitting ? (
            <>
              <Spinner animation="border" size="sm" aria-hidden="true" /> Creating account…
            </>
          ) : (
            <>
              <FiUserPlus aria-hidden="true" /> {isVet ? 'Create veterinarian account' : 'Create pet-owner account'}
            </>
          )}
        </Button>
      </Form>
      <p className="auth-switch">
        Already have an account? <Link to="/login" state={location.state}>Log in</Link>
      </p>
    </AuthLayout>
  );
}
