/**
 * MeetTheVets — Home "Meet the vets" section: the clinic's veterinarians as
 * centered cards with their daily hours.
 */
import { Container } from 'react-bootstrap';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Reveal from '../../../components/Reveal';
import SectionHeading from '../../../components/SectionHeading';
import VetCard from '../../../components/VetCard';

export default function MeetTheVets({ vets, loading }) {
  return (
    <section className="section section-soft" aria-labelledby="team-title">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Meet the vets"
            title={<span id="team-title">Veterinarians who love what they do</span>}
            subtitle="Licensed, gentle and great with nervous pets. Both vets are on duty every day, so two queue lanes are always open."
          />
        </Reveal>

        {loading && !vets.length ? (
          <LoadingSpinner label="Loading veterinarians…" />
        ) : (
          <div className="vet-team">
            {vets.map((vet) => (
              <VetCard key={vet.id} vet={vet} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
