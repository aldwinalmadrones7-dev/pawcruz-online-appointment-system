/**
 * FeaturedServices — The services flagged "featured", with a link to the full list.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import ServiceCard from '../../../components/ServiceCard';

export default function FeaturedServices({ services, loading }) {
  const featured = services.filter((service) => service.featured).slice(0, 4);

  return (
    <section className="section">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Popular services" title="Care for every kind of pet" subtitle="Starting prices in Philippine pesos — your vet explains any extra costs before treatment." />
        </Reveal>
        {loading && !services.length ? (
          <LoadingSpinner label="Loading services…" />
        ) : (
          <Row className="g-4">
            {featured.map((service, index) => (
              <Col sm={6} lg={3} key={service.id}>
                <Reveal delay={index * 90} className="h-100">
                  <ServiceCard
                    service={service}
                    compact
                    action={
                      <Button as={Link} to={`/owner/book?service=${service.id}`} variant="soft" size="sm" className="w-100">
                        Book this
                      </Button>
                    }
                  />
                </Reveal>
              </Col>
            ))}
          </Row>
        )}
        <div className="text-center mt-5">
          <Button as={Link} to="/services" variant="outline-ink">
            See all {services.length || ''} services <FiArrowRight aria-hidden="true" />
          </Button>
        </div>
      </Container>
    </section>
  );
}
