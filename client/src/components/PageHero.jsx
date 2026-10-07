/**
 * PageHero — Soft header band for public pages (Services, Veterinarians, About, Contact)
 * with floating sparkles and a wave into the page body.
 */
import { Container } from 'react-bootstrap';
import { SparkleIcon } from './BrandIcons';
import WaveDivider from './WaveDivider';

export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <>
      <section className="page-hero">
        <SparkleIcon size={22} className="hero-spark spark-a" />
        <SparkleIcon size={14} className="hero-spark spark-b" />
        <SparkleIcon size={10} className="hero-spark spark-c" />
        <Container className="container-narrow text-center">
          {eyebrow && (
            <span className="eyebrow">
              <SparkleIcon size={12} /> {eyebrow}
            </span>
          )}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-subtitle">{subtitle}</p>}
          {children}
        </Container>
      </section>
      <WaveDivider from="var(--surface-alt)" to="var(--bg)" variant="swell" />
    </>
  );
}
