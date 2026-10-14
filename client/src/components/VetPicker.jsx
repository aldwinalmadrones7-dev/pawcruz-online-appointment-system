/**
 * VetPicker — Compact list of veterinarians who are free at the chosen time;
 * pick one (radio behavior). Used in the rebook modal and the admin appointment form.
 */
import { FaUserMd } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import { formatShift, formatVetName } from '../utils/formatters';
import ImageWithFallback from './ImageWithFallback';

export default function VetPicker({ vets, value, onChange, emptyMessage = 'Pick a time first to see which vets are free.' }) {
  if (!vets.length) return <p className="slot-empty">{emptyMessage}</p>;

  return (
    <div className="vet-picker" role="radiogroup" aria-label="Veterinarian">
      {vets.map((vet) => {
        const selected = vet.id === value;
        return (
          <button key={vet.id} type="button" role="radio" aria-checked={selected} className={`vet-option${selected ? ' is-selected' : ''}`} onClick={() => onChange(vet.id)}>
            <ImageWithFallback src={vet.photo} alt="" icon={FaUserMd} className="vet-option-photo" />
            <span className="vet-option-text">
              <strong>{formatVetName(vet)}</strong>
              <small>
                {vet.specialty} · {formatShift(vet)}
              </small>
            </span>
            <span className="vet-option-check" aria-hidden="true">
              {selected && <FiCheck />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
