/**
 * Forbidden — "403 Not Authorized" page shown by RoleRoute when a user opens an
 * area their role can't access (e.g. a patient visiting /admin).
 */
import { Button, Container } from 'react-bootstrap';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { SparkleIcon } from '../../components/BrandIcons';
import useAuth from '../../hooks/useAuth';
import { getDashboardPath } from '../../utils/routes';

export default function Forbidden() {
  const { role } = useAuth();

  return (
    <section className="section error-page">
      <Container className="text-center">
        <div className="error-illustration" aria-hidden="true">
          <span className="error-lock">
            <FiLock />
          </span>
          <SparkleIcon size={22} className="error-spark spark-1" />
          <SparkleIcon size={14} className="error-spark spark-2" />
        </div>
        <p className="error-eyebrow">Error 403</p>
        <h1 className="error-title">403 — Not authorized</h1>
        <p className="error-text">This area is for a different kind of account, so yours doesn't have access to it.</p>
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          <Button as={Link} to={getDashboardPath(role)} variant="brand" size="lg">
            <FiArrowLeft aria-hidden="true" /> Go to my dashboard
          </Button>
          <Button as={Link} to="/" variant="outline-ink" size="lg">
            Back to home
          </Button>
        </div>
      </Container>
    </section>
  );
}
