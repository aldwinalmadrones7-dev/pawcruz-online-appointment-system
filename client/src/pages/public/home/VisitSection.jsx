/**
 * VisitSection — Clinic hours plus location and contact details.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FiMail, FiMapPin, FiNavigation, FiPhone } from 'react-icons/fi';
import { PawIcon, SparkleIcon } from '../../../components/BrandIcons';
import ClinicHoursCard from '../../../components/ClinicHoursCard';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import { CLINIC_INFO } from '../../../utils/constants';

export default function VisitSection() {
  return (
    <section className="section section-soft">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Visit us" title="Open every day in Pasay City" subtitle="Monday to Sunday, 9:00 AM to 7:00 PM — with two veterinarian queue lanes to keep waits short." />
        </Reveal>
        <Row className="g-4 align-items-stretch">
          <Col lg={6}>
            <Reveal className="h-100">
              <ClinicHoursCard className="h-100" />
            </Reveal>
          </Col>
          <Col lg={6}>
            <Reveal delay={120} className="h-100">
              <div className="pc-card location-card h-100">
                <div className="map-art" aria-hidden="true">
                  <span className="map-road road-1" />
                  <span className="map-road road-2" />
                  <span className="map-road road-3" />
                  <span className="map-pin">
                    <PawIcon size={20} />
                  </span>
                  <SparkleIcon size={14} className="map-spark" />
                </div>
                <div className="pc-card-body">
                  <ul className="contact-list">
                    <li>
                      <FiMapPin aria-hidden="true" />
                      <span>{CLINIC_INFO.address}</span>
                    </li>
                    <li>
                      <FiPhone aria-hidden="true" />
                      <span>
                        {CLINIC_INFO.phones.map((phone, index) => (
                          <span key={phone}>
                            {index > 0 && ' | '}
                            <a href={`tel:${phone}`}>{phone}</a>
                          </span>
                        ))}
                      </span>
                    </li>
                    <li>
                      <FiMail aria-hidden="true" />
                      <a href={`mailto:${CLINIC_INFO.email}`}>{CLINIC_INFO.email}</a>
                    </li>
                  </ul>
                  <Button href={CLINIC_INFO.mapUrl} target="_blank" rel="noreferrer" variant="outline-ink" size="sm">
                    <FiNavigation aria-hidden="true" /> Get directions
                  </Button>
                </div>
              </div>
            </Reveal>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
