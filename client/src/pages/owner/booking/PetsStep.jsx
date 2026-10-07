/**
 * PetsStep — Wizard step 1: choose which pets are coming (one or more, each gets its
 * own 10-minute slot) and the reason for the visit. Pets can be added on the spot.
 */
import { Col, Form, Row } from 'react-bootstrap';
import { FiInfo, FiPlus } from 'react-icons/fi';
import PetCard from '../../../components/PetCard';
import { MAX_PETS_PER_VISIT } from '../../../utils/constants';
import { formatCurrency, formatVetName } from '../../../utils/formatters';

export default function PetsStep({ pets, selectedIds, onTogglePet, onAddPet, services, serviceId, onServiceChange, presetVet }) {
  return (
    <>
      <h2 className="step-title">Who’s coming in?</h2>
      <p className="step-text">
        Select one or more pets (up to {MAX_PETS_PER_VISIT}). Each pet gets its own 10-minute consultation slot, back to back with the same vet.
      </p>
      {presetVet && (
        <p className="step-note">
          <FiInfo aria-hidden="true" /> You’re booking with {formatVetName(presetVet)} — we’ll show their open times next.
        </p>
      )}

      <Row className="g-3 mb-4">
        {pets.map((pet) => (
          <Col sm={6} xl={4} key={pet.id}>
            <PetCard pet={pet} selected={selectedIds.includes(pet.id)} onSelect={() => onTogglePet(pet.id)} />
          </Col>
        ))}
        <Col sm={6} xl={4}>
          <button type="button" className="add-pet-tile" onClick={onAddPet}>
            <span className="pet-add-icon" aria-hidden="true">
              <FiPlus />
            </span>
            <strong>Add a pet</strong>
            <small>Not on the list yet? Add them here.</small>
          </button>
        </Col>
      </Row>

      <Form.Group controlId="booking-reason">
        <Form.Label>
          Reason for visit <span className="required-mark" aria-hidden="true">*</span>
        </Form.Label>
        <Form.Select value={serviceId} onChange={(event) => onServiceChange(event.target.value)}>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · from {formatCurrency(service.price)}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="field-hint">Consultation type: General Consultation. Your vet confirms the exact treatment and cost during the visit.</Form.Text>
      </Form.Group>
    </>
  );
}
