/**
 * Testimonials — Three patient quotes with photos and ratings.
 */
import { Col, Container, Row } from 'react-bootstrap';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import ImageWithFallback from '../../../components/ImageWithFallback';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import { TESTIMONIALS } from '../../../data/siteContent';

export default function Testimonials() {
  return (
    <section className="section">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Kind words" title="Happy pets, happy humans" subtitle="Real stories from pet parents who stopped dreading vet day." />
        </Reveal>
        <Row className="g-4">
          {TESTIMONIALS.map((item, index) => (
            <Col md={4} key={item.name}>
              <Reveal delay={index * 120} className="h-100">
                <figure className="testimonial-card">
                  <FaQuoteLeft className="testimonial-quote-icon" aria-hidden="true" />
                  <div className="testimonial-stars" role="img" aria-label="5 out of 5 stars">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <FaStar key={star} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote>
                    <p>{item.quote}</p>
                  </blockquote>
                  <figcaption>
                    <ImageWithFallback src={item.image} alt={item.name} icon={FiUser} className="testimonial-photo" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.role}</small>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
