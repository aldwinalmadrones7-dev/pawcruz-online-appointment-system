/**
 * VetDetail — One veterinarian's profile: photo, bio, education, languages, PRC license,
 * weekly duty days and shift hours, and a "Book with this vet" button.
 */
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiArrowLeft, FiAward, FiBookOpen, FiCalendar, FiClock, FiGlobe, FiShield } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { SparkleIcon } from '../../components/BrandIcons';
import DayChips from '../../components/DayChips';
import EmptyState from '../../components/EmptyState';
import ImageWithFallback from '../../components/ImageWithFallback';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import useAsync from '../../hooks/useAsync';
import { getVetById } from '../../services/vetService';
import { formatShift, formatVetName, formatWeekdays } from '../../utils/formatters';

export default function VetDetail() {
  const { id } = useParams();
  const { data: vet, loading, error } = useAsync(() => getVetById(id), [id]);

  if (loading && !vet) return <LoadingSpinner fullPage label="Loading veterinarian…" />;

  if (error || !vet) {
    return (
      <Container className="section">
        <EmptyState
          icon={FaUserMd}
          title="Veterinarian not found"
          message="This profile may have been removed. Browse the rest of our team instead."
          action={
            <Button as={Link} to="/vets" variant="brand">
              See all veterinarians
            </Button>
          }
        />
      </Container>
    );
  }

  const name = formatVetName(vet);
  const tiles = [
    { icon: FiBookOpen, label: 'Education', value: vet.education || 'Doctor of Veterinary Medicine' },
    { icon: FiGlobe, label: 'Speaks', value: (vet.languages ?? []).join(', ') },
    { icon: FiCalendar, label: 'On duty', value: formatWeekdays(vet.availableDays) },
    { icon: FiClock, label: 'Shift', value: formatShift(vet) },
    { icon: FiShield, label: 'PRC license', value: vet.licenseNo },
    { icon: FiAward, label: 'Experience', value: `${vet.yearsExperience} years` },
  ];

  return (
    <section className="section vet-detail">
      <Container>
        <Link to="/vets" className="back-link">
          <FiArrowLeft aria-hidden="true" /> All veterinarians
        </Link>
        <Row className="g-4 g-lg-5 mt-1">
          <Col lg={4}>
            <div className="detail-photo-card">
              <ImageWithFallback src={vet.photo} alt={`Portrait of ${name}`} icon={FaUserMd} ratio="4 / 5" loading="eager" />
              <SparkleIcon size={22} className="detail-spark" />
            </div>
            <Button as={Link} to={`/owner/book?vet=${vet.id}`} variant="cta" size="lg" className="w-100 mt-3">
              <FiCalendar aria-hidden="true" /> Book with this vet
            </Button>
          </Col>

          <Col lg={8}>
            <span className="eyebrow">{vet.specialty}</span>
            <h1 className="detail-name">{name}</h1>
            <div className="detail-meta">
              <RatingStars rating={vet.rating} count={vet.reviewCount} />
              <span>
                <FiAward aria-hidden="true" /> {vet.title}
              </span>
            </div>
            <p className="detail-bio">{vet.bio}</p>

            <Row className="g-3 mb-4">
              {tiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Col md={6} key={tile.label}>
                    <div className="info-tile">
                      <Icon aria-hidden="true" />
                      <div>
                        <small>{tile.label}</small>
                        <strong className="text-break">{tile.value}</strong>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>

            <h2 className="h4 mb-3">Weekly duty days</h2>
            <DayChips days={vet.availableDays} size="lg" />
            <p className="mt-3 mb-0">
              Appointments with {name} run in 10-minute slots within {formatShift(vet)}. Bringing more than one pet? Book them together for back-to-back slots.
            </p>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
