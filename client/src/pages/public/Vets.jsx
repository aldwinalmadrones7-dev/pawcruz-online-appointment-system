/**
 * Vets — The veterinary team as cards (photo, specialty, rating, duty days, shift).
 * PawCruz has two vets on duty every day: Dr. Redmond opens the clinic, Dr. Neil closes it.
 */
import { Button, Container } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import CtaBand from '../../components/CtaBand';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHero from '../../components/PageHero';
import VetCard from '../../components/VetCard';
import useAsync from '../../hooks/useAsync';
import { getVets } from '../../services/vetService';

export default function Vets() {
  const { data, loading, error, reload } = useAsync(() => getVets(), []);

  return (
    <>
      <PageHero
        eyebrow="Our veterinarians"
        title="Meet the hands that heal your pets"
        subtitle="PRC-licensed, gentle and genuinely fond of animals. Both vets are on duty every day, so pick the hours that fit your schedule."
      />
      <section className="section pt-2">
        <Container>
          {loading && !data ? (
            <LoadingSpinner label="Loading veterinarians…" />
          ) : error ? (
            <EmptyState title="We couldn't load our veterinarians" message={error.message} tone="accent" action={<Button variant="brand" onClick={reload}>Try again</Button>} />
          ) : data?.length ? (
            <div className="vet-team">
              {data.map((vet) => (
                <VetCard key={vet.id} vet={vet} />
              ))}
            </div>
          ) : (
            <EmptyState icon={FaUserMd} title="No veterinarians yet" message="Please check back soon." />
          )}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
