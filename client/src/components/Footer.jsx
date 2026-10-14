/**
 * Footer — Site footer: brand, quick links, contact details, hours summary and socials.
 */
import { Col, Container, Row } from 'react-bootstrap';
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { APP_TAGLINE, CLINIC_INFO } from '../utils/constants';
import BrandLogo from './BrandLogo';
import WaveDivider from './WaveDivider';

const QUICK_LINKS = [
  { to: '/queue', label: 'Live queue' },
  { to: '/services', label: 'Services & pricing' },
  { to: '/vets', label: 'Our veterinarians' },
  { to: '/about', label: 'About the clinic' },
  { to: '/contact', label: 'Contact us' },
];

const ACCOUNT_LINKS = [
  { to: '/owner/book', label: 'Book an appointment' },
  { to: '/owner/pets', label: 'My pets' },
  { to: '/login', label: 'Log in' },
  { to: '/register', label: 'Create an account' },
  { to: '/register?role=vet', label: 'Veterinarian sign-up' },
];

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="site-footer">
      <WaveDivider from="var(--bg)" to="var(--section-dark)" />
      <div className="footer-body">
        <Container>
          <Row className="g-4 g-lg-5">
            <Col lg={4}>
              <BrandLogo light />
              <p className="footer-tagline">Compassionate care for every paw. {APP_TAGLINE}</p>
              <ul className="footer-social" aria-label="Social media">
                <li>
                  <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                    <FaFacebookF aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <FaInstagram aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                    <FaTiktok aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </Col>
            <Col xs={6} lg={2}>
              <h3 className="footer-heading">Clinic</h3>
              <ul className="footer-links">
                {QUICK_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </Col>
            <Col xs={6} lg={3}>
              <h3 className="footer-heading">Your account</h3>
              <ul className="footer-links">
                {ACCOUNT_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </Col>
            <Col lg={3}>
              <h3 className="footer-heading">Visit us</h3>
              <ul className="footer-contact">
                <li>
                  <FiMapPin aria-hidden="true" /> {CLINIC_INFO.address}
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
                  <FiMail aria-hidden="true" /> <a href={`mailto:${CLINIC_INFO.email}`}>{CLINIC_INFO.email}</a>
                </li>
              </ul>
              <p className="footer-hours">Open Monday–Sunday · 9:00 AM–7:00 PM</p>
            </Col>
          </Row>
          <div className="footer-bottom">
            <span>© {CURRENT_YEAR} PawCruz Veterinary Clinic. All rights reserved.</span>
            <span>CTADWEBL – Advanced Web Programming · MERN project</span>
          </div>
        </Container>
      </div>
    </footer>
  );
}
