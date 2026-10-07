/**
 * HowItWorks — The three booking steps, connected by a dashed line on desktop.
 */
import { Col, Container, Row } from 'react-bootstrap';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import { HOW_IT_WORKS } from '../../../data/siteContent';

export default function HowItWorks() {
  return (
    <section className="section section-soft" aria-labelledby="how-title">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title={<span id="how-title">Three steps to a happy, healthy pet</span>}
            subtitle="No calls, no long lines. Book from your phone in less time than it takes to fill a water bowl."
          />
        </Reveal>
        <Row className="g-4 steps-row">
          {HOW_IT_WORKS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Col md={4} key={step.title}>
                <Reveal delay={index * 120} className="how-card">
                  <span className="how-number">0{index + 1}</span>
                  <span className="how-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
}
