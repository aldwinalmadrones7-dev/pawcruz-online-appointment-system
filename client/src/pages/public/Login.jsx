/**
 * Login — Email/password sign-in with inline validation, show/hide password,
 * a loading state, and a redirect back to the page
 * the visitor originally wanted.
 */
import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { FiAlertCircle, FiInfo, FiLogIn } from 'react-icons/fi';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormField from '../../components/FormField';
import PasswordInput from '../../components/PasswordInput';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { getPostLoginPath } from '../../utils/routes';
import { validateLogin } from '../../utils/validators';
import AuthLayout from './AuthLayout';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [authError, setAuthError] = useState('');
  const form = useForm({ email: '', password: '' }, validateLogin);

  // Already logged in? Go straight to the right place.
  if (user) return <Navigate to={getPostLoginPath(user, from)} replace />;

  const onSubmit = form.handleSubmit(async (values) => {
    setAuthError('');
    try {
      const loggedIn = await login(values);
      toast.success(`Welcome back, ${loggedIn.firstName}!`);
      navigate(getPostLoginPath(loggedIn, from), { replace: true });
    } catch (err) {
      setAuthError(err.message);
    }
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to book visits and manage your pets.">
      {from && (
        <Alert variant="soft" className="d-flex gap-2 align-items-center">
          <FiInfo aria-hidden="true" /> Please log in to continue.
        </Alert>
      )}
      {authError && (
        <Alert variant="danger" className="d-flex gap-2 align-items-center" role="alert">
          <FiAlertCircle aria-hidden="true" /> {authError}
        </Alert>
      )}

      <Form noValidate onSubmit={onSubmit} className="auth-fields">
        <FormField label="Email" type="email" required autoComplete="email" placeholder="you@email.com" error={form.errors.email} {...form.register('email')} />
        <FormField label="Password" controlId="login-password" required error={form.errors.password}>
          <PasswordInput autoComplete="current-password" placeholder="Your password" aria-required="true" {...form.register('password')} />
        </FormField>
        <Button type="submit" variant="brand" size="lg" className="w-100 mt-1" disabled={form.submitting}>
          {form.submitting ? (
            <>
              <Spinner animation="border" size="sm" aria-hidden="true" /> Logging in…
            </>
          ) : (
            <>
              <FiLogIn aria-hidden="true" /> Log in
            </>
          )}
        </Button>
      </Form>

      <p className="auth-switch">
        New to PawCruz? <Link to="/register" state={location.state}>Create a free account</Link>
      </p>
    </AuthLayout>
  );
}
