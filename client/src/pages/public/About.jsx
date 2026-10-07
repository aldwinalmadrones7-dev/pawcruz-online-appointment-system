/**
 * About — The clinic's story, values, numbers and team photo.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { SparkleIcon } from '../../components/BrandIcons';
import CtaBand from '../../components/CtaBand';
import ImageWithFallback from '../../components/ImageWithFallback';
import PageHero from '../../components/PageHero';
import Reveal from '../../components/Reveal';
import SectionHeading from '../../components/SectionHeading';
import WaveDivider from '../../components/WaveDivider';
import { CLINIC_STATS, CLINIC_VALUES } from '../../data/siteContent';

export default function About() {
  return (
    <>
      <PageHero
        eyebrow="About PawCruz"
        title="A neighborhood vet clinic that feels like family"
        subtitle="PawCruz Veterinary Clinic cares for dogs, cats and exotic pets in Pasay City — with compassionate vets, honest prices and online booking that respects your time."
      />

      <section className="section pt-2">
        <Container>
          <Row className="g-4 g-lg-5 align-items-center">
            <Col lg={6}>
              <Reveal className="about-media">
                <ImageWithFallback src="/images/clinic-interior.jpg" alt="Bright, clean examination room at PawCruz Veterinary Clinic" ratio="4 / 3" className="about-img" />
                <SparkleIcon size={28} className="about-spark" />
              </Reveal>
            </Col>
            <Col lg={6}>
              <Reveal delay={120}>
                <SectionHeading align="start" eyebrow="Our story" title="Built for pet parents who hate waiting rooms" />
                <p>
                  PawCruz started as a small clinic inside a pet center on A. Luna Street. Long lines on weekends pushed us to build a better way: book
                  online, get a queue number, and walk in right on time.
                </p>
                <p>
                  Today Dr. Neil Norman A. Cruz and Dr. Redmond Lopez run two queue lanes every day of the week — from vaccines and deworming to surgery, dentistry and exotic pet
                  care.
                </p>
                <Button as={Link} to="/vets" variant="outline-ink">
                  Meet the veterinarians <FiArrowRight aria-hidden="true" />
                </Button>
              </Reveal>
            </Col>
          </Row>
        </Container>
      </section>

      <WaveDivider from="var(--bg)" to="var(--surface-alt)" />
      <section className="section section-soft">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="What we believe" title="Little things that make a big difference" />
          </Reveal>
          <Row className="g-4">
            {CLINIC_VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <Col sm={6} lg={3} key={value.title}>
                  <Reveal delay={index * 100} className="value-card h-100">
                    <span className="value-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <h3>{value.title}</h3>
                    <p>{value.text}</p>
                  </Reveal>
                </Col>
              );
            })}
          </Row>
        </Container>
      </section>
      <WaveDivider from="var(--surface-alt)" to="var(--bg)" variant="swell" />

      <section className="section pt-3">
        <Container>
          <div className="stats-band">
            {CLINIC_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="stats-item" key={stat.label}>
                  <Icon aria-hidden="true" />
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              );
            })}
          </div>

          <Row className="g-4 g-lg-5 align-items-center mt-4">
            <Col lg={{ span: 6, order: 2 }}>
              <Reveal className="about-media">
                <ImageWithFallback src="/images/team.jpg" alt="The PawCruz veterinary team with patients" ratio="4 / 3" className="about-img" />
              </Reveal>
            </Col>
            <Col lg={{ span: 6, order: 1 }}>
              <Reveal delay={120}>
                <SectionHeading align="start" eyebrow="The team" title="Eight vets, one friendly front desk" />
                <p>
                  Our vets speak English, Filipino and a few regional languages, so you can explain your pet’s symptoms however feels natural. Every
                  veterinarian is PRC-licensed and keeps learning through continuing education each year.
                </p>
                <Button as={Link} to="/owner/book" variant="brand">
                  Book a visit
                </Button>
              </Reveal>
            </Col>
          </Row>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
