/**
 * VetStep — Wizard step 3: choose one of the veterinarians who are free at the chosen time.
 */
import { Col, Row } from 'react-bootstrap';
import EmptyState from '../../../components/EmptyState';
import VetCard from '../../../components/VetCard';
import { formatDateShort, formatTime } from '../../../utils/formatters';

export default function VetStep({ vets, selectedId, onSelect, date, startTime }) {
  return (
    <>
      <h2 className="step-title">Choose your veterinarian</h2>
      <p className="step-text">
        {vets.length} vet{vets.length === 1 ? ' is' : 's are'} free on {formatDateShort(date)} at {formatTime(startTime)}.
      </p>
      {vets.length ? (
        <Row className="g-3">
          {vets.map((vet) => (
            <Col sm={6} xl={4} key={vet.id}>
              <VetCard vet={vet} selected={vet.id === selectedId} onSelect={() => onSelect(vet.id)} showActions={false} />
            </Col>
          ))}
        </Row>
      ) : (
        <EmptyState compact title="No vet is free at that time anymore" message="Please go back and pick another time." />
      )}
    </>
  );
}
