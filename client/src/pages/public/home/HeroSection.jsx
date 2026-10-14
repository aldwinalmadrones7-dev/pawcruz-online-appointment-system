/**
 * HeroSection — Landing hero: headline, booking CTA, trust stats and the hero photo
 * with floating "appointment confirmed" cards and sparkles.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import { FiArrowRight, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { LuSyringe } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { SparkleIcon } from '../../../components/BrandIcons';
import ImageWithFallback from '../../../components/ImageWithFallback';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden="true" />
      <Container>
        <Row className="align-items-center g-4 g-lg-5">
          <Col lg={6} className="hero-copy">
            <span className="hero-pill">
              <SparkleIcon size={12} /> Now booking online · Pasay City
            </span>
            <h1 className="hero-title">
              Compassionate care for every <span className="hl">paw</span>.
            </h1>
            <p className="hero-lead">
              Book your pet’s next visit in under a minute. Pick your pets, choose an open 10-minute slot and a veterinarian — then skip the long
              wait with your queue number.
            </p>
            <div className="hero-cta">
              <Button as={Link} to="/owner/book" variant="cta" size="lg">
                <FiCalendar aria-hidden="true" /> Book an Appointment
              </Button>
              <Button as={Link} to="/vets" variant="outline-ink" size="lg">
                Meet our vets <FiArrowRight aria-hidden="true" />
              </Button>
            </div>
            <ul className="hero-trust">
              <li>
                <strong>
                  4.9 <FaStar className="text-accent" aria-hidden="true" />
                </strong>
                <span>from 900+ pet parents</span>
              </li>
              <li>
                <strong>2</strong>
                <span>licensed veterinarians</span>
              </li>
              <li>
                <strong>Mon–Sun</strong>
                <span>9 AM – 7 PM</span>
              </li>
            </ul>
          </Col>

          <Col lg={6}>
            <div className="hero-visual">
              <div className="hero-blob" aria-hidden="true" />
              <div className="hero-frame">
                <ImageWithFallback src="/images/hero.jpg" alt="Happy dog with its owner at a friendly veterinary clinic" loading="eager" className="hero-img" />
              </div>
              <div className="float-card float-top" aria-hidden="true">
                <span className="float-icon is-brand">
                  <FiCheckCircle />
                </span>
                <div>
                  <strong>Appointment confirmed</strong>
                  <small>Queue E-004 · Today 10:30 AM</small>
                </div>
              </div>
              <div className="float-card float-bottom" aria-hidden="true">
                <span className="float-icon is-accent">
                  <LuSyringe />
                </span>
                <div>
                  <strong>Vaccination</strong>
                  <small>from ₱850 · 10-min slot</small>
                </div>
              </div>
              <SparkleIcon size={26} className="hero-spark spark-1" />
              <SparkleIcon size={16} className="hero-spark spark-2" />
              <SparkleIcon size={12} className="hero-spark spark-3" />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
