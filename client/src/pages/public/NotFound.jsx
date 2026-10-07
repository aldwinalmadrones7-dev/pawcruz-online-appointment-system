/**
 * NotFound — Friendly 404 page with a "lost paw" illustration.
 */
import { Button, Container } from 'react-bootstrap';
import { FiCalendar, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { PawIcon, SparkleIcon } from '../../components/BrandIcons';

export default function NotFound() {
  return (
    <section className="section error-page">
      <Container className="text-center">
        <div className="error-illustration" aria-hidden="true">
          <span className="error-code">4</span>
          <span className="error-paw">
            <PawIcon size={92} shine />
          </span>
          <span className="error-code">4</span>
          <SparkleIcon size={22} className="error-spark spark-1" />
          <SparkleIcon size={14} className="error-spark spark-2" />
        </div>
        <h1 className="error-title">This page wandered off like a curious cat.</h1>
        <p className="error-text">The link may be broken or the page may have moved. Let’s get you and your pet back on track.</p>
        <div className="d-flex flex-wrap gap-3 justify-content-center">
          <Button as={Link} to="/" variant="brand" size="lg">
            <FiHome aria-hidden="true" /> Back to home
          </Button>
          <Button as={Link} to="/owner/book" variant="outline-ink" size="lg">
            <FiCalendar aria-hidden="true" /> Book an appointment
          </Button>
        </div>
      </Container>
    </section>
  );
}
