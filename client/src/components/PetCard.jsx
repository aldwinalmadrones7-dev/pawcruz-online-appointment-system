/**
 * PetCard — A pet's profile card (species, breed, sex, age, weight, notes).
 * Pass `onSelect` to use it as a checkbox-style choice (booking), or `actions` for buttons.
 */
import { FiCheck } from 'react-icons/fi';
import { formatPetAge } from '../utils/formatters';
import PetAvatar from './PetAvatar';

export default function PetCard({ pet, selected = false, onSelect, actions, footer }) {
  const facts = [
    { label: 'Sex', value: pet.sex },
    { label: 'Age', value: formatPetAge(pet.birthDate) || '—' },
    { label: 'Weight', value: pet.weight ? `${pet.weight} kg` : '—' },
  ];

  return (
    <article className={`pet-card${onSelect ? ' is-selectable' : ''}${selected ? ' is-selected' : ''}`}>
      <div className="pet-card-head">
        <PetAvatar species={pet.species} size={52} />
        <div className="pet-card-title">
          <h3>{pet.name}</h3>
          <span>{pet.breed ? `${pet.breed} · ${pet.species}` : pet.species}</span>
        </div>
        {onSelect && (
          <span className={`pet-check${selected ? ' is-on' : ''}`} aria-hidden="true">
            {selected && <FiCheck />}
          </span>
        )}
      </div>
      <dl className="pet-facts">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {pet.notes && <p className="pet-notes">{pet.notes}</p>}
      {footer}
      {actions && <div className="pet-actions">{actions}</div>}
      {onSelect && (
        <button
          type="button"
          className="stretched-select"
          role="checkbox"
          aria-checked={selected}
          aria-label={`${pet.name}, ${pet.breed || pet.species}`}
          onClick={() => onSelect(pet)}
        />
      )}
    </article>
  );
}
