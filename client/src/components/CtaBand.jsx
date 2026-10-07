/**
 * CtaBand — Dark call-to-action strip used at the bottom of public pages.
 */
import { Button, Container } from 'react-bootstrap';
import { FiCalendar, FiPhone } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { CLINIC_INFO } from '../utils/constants';
import { PawIcon, SparkleIcon } from './BrandIcons';

export default function CtaBand({
  title = 'Your pet’s next check-up is one minute away.',
  text = 'Pick your pets, a time and a vet — and skip the long wait at the clinic.',
}) {
  return (
    <section className="cta-band-wrap">
      <Container>
        <div className="cta-band">
          <PawIcon size={150} className="cta-paw" />
          <SparkleIcon size={20} className="cta-spark cta-spark-1" />
          <SparkleIcon size={12} className="cta-spark cta-spark-2" />
          <div className="cta-copy">
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="cta-actions">
            <Button as={Link} to="/owner/book" variant="cta" size="lg">
              <FiCalendar aria-hidden="true" /> Book an Appointment
            </Button>
            <a className="cta-phone" href={`tel:${CLINIC_INFO.phones[0]}`}>
              <FiPhone aria-hidden="true" /> {CLINIC_INFO.phones[0]}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
