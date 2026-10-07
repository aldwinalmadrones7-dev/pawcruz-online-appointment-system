/**
 * FaqSection — Frequently asked questions in an accordion.
 */
import { Accordion, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import { FAQS } from '../../../data/siteContent';

export default function FaqSection() {
  return (
    <section className="section">
      <Container>
        <Row className="g-4 g-lg-5">
          <Col lg={4}>
            <Reveal>
              <SectionHeading align="start" eyebrow="FAQ" title="Questions? We've got answers." subtitle="Can't find what you need? Message us and our front desk will reply within one business day." />
              <Link to="/contact" className="fw-bold">
                Contact the clinic →
              </Link>
            </Reveal>
          </Col>
          <Col lg={8}>
            <Reveal delay={100}>
              <Accordion defaultActiveKey="0" className="faq-accordion">
                {FAQS.map((faq, index) => (
                  <Accordion.Item eventKey={String(index)} key={faq.question}>
                    <Accordion.Header as="h3">{faq.question}</Accordion.Header>
                    <Accordion.Body>{faq.answer}</Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Reveal>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
