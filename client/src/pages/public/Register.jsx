/**
 * Register — Pet-owner sign-up with full validation (names, email, PH mobile number,
 * strong password + live checklist, confirm password, data privacy consent).
 * New accounts are logged in right away.
 */
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { FiUserPlus } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../../components/FormField';
import PasswordChecklist from '../../components/PasswordChecklist';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { getPostLoginPath } from '../../utils/routes';
import { sanitizePhoneInput, validateRegister } from '../../utils/validators';
import AuthLayout from './AuthLayout';

const INITIAL_VALUES = { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', agree: false };

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const form = useForm(INITIAL_VALUES, validateRegister);
  const { values, errors } = form;

  if (user) return <Navigate to={getPostLoginPath(user, from)} replace />;

  const onSubmit = form.handleSubmit(async (formValues) => {
    try {
      const created = await register(formValues);
      toast.success(`Welcome to PawCruz, ${created.firstName}! Add your pets to start booking.`);
      navigate(getPostLoginPath(created, from), { replace: true });
    } catch (err) {
      if (!form.applyServerError(err)) toast.error(err.message);
    }
  });

  return (
    <AuthLayout title="Create your pet-owner account" subtitle="It's free and takes less than a minute." wide>
      <Form noValidate onSubmit={onSubmit} className="auth-fields">
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
              <FiUserPlus aria-hidden="true" /> Create account
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
