/**
 * ReviewStep — Wizard step 4: review the visit (each pet's slot, vet, reason, fee),
 * add notes for the vet and confirm the clinic policy.
 */
import { Form } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCalendar, FiClipboard, FiDollarSign, FiMapPin, FiUser } from 'react-icons/fi';
import DetailList from '../../../components/DetailList';
import PetAvatar from '../../../components/PetAvatar';
import { CLINIC_INFO, CONSULTATION_TYPE } from '../../../utils/constants';
import { formatCurrency, formatDateLong, formatTimeRange, formatVetName, getFullName } from '../../../utils/formatters';
import { addMinutesToTime, SLOT_MINUTES } from '../../../utils/schedule';

export default function ReviewStep({ user, pets, service, vet, date, startTime, notes, onNotesChange, agree, onAgreeChange, agreeError }) {
  return (
    <>
      <h2 className="step-title">Review and confirm</h2>
      <p className="step-text">Double-check your booking. You can still go back to change anything.</p>

      <ul className="review-pets">
        {pets.map((pet, index) => {
          const petStart = addMinutesToTime(startTime, index * SLOT_MINUTES);
          return (
            <li key={pet.id}>
              <PetAvatar species={pet.species} size={40} />
              <span>
                <strong>{pet.name}</strong>
                <small>{pet.breed || pet.species}</small>
              </span>
              <em>{formatTimeRange(petStart, addMinutesToTime(petStart, SLOT_MINUTES))}</em>
            </li>
          );
        })}
      </ul>

      <DetailList
        items={[
          { icon: FiUser, label: 'Pet owner', value: `${getFullName(user)} · ${user.phone}` },
          { icon: FiClipboard, label: 'Reason', value: `${service.name} (${CONSULTATION_TYPE})` },
          { icon: FaUserMd, label: 'Veterinarian', value: `${formatVetName(vet)} · ${vet.specialty}` },
          { icon: FiCalendar, label: 'Date', value: formatDateLong(date) },
          { icon: FiMapPin, label: 'Location', value: CLINIC_INFO.address },
          { icon: FiDollarSign, label: 'Estimated fee', value: `from ${formatCurrency(service.price * pets.length)}${pets.length > 1 ? ` (${pets.length} pets)` : ''}` },
        ]}
      />

      <Form.Group className="mt-4 mb-3" controlId="booking-notes">
        <Form.Label>
          Notes for the vet <span className="text-muted-soft fw-normal">(optional)</span>
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Symptoms, how long it's been happening, medicines your pet takes…"
        />
        <span className="char-count">{notes.length}/500</span>
      </Form.Group>

      <Form.Check
        type="checkbox"
        id="booking-policy"
        checked={agree}
        onChange={(event) => onAgreeChange(event.target.checked)}
        isInvalid={Boolean(agreeError)}
        label="I’ll arrive 10 minutes early with my pet on a leash or in a carrier, and I’ll cancel or rebook ahead if we can’t make it."
      />
      {agreeError && <div className="invalid-feedback d-block">{agreeError}</div>}
    </>
  );
}
