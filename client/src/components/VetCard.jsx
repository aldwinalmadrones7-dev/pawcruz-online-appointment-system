/**
 * VetCard — Veterinarian portrait, specialty, rating, duty days and shift hours.
 * Shows "View profile" / "Book" buttons, or acts as a selectable option when `onSelect` is passed.
 */
import { Button } from 'react-bootstrap';
import { FaUserMd } from 'react-icons/fa';
import { FiCheck, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatShift, formatVetName } from '../utils/formatters';
import DayChips from './DayChips';
import ImageWithFallback from './ImageWithFallback';
import RatingStars from './RatingStars';

export default function VetCard({ vet, selected = false, onSelect, showActions = true, note }) {
  const name = formatVetName(vet);
  const classes = ['vet-card', onSelect ? 'is-selectable' : 'hover-lift', selected ? 'is-selected' : ''].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <div className="vet-photo">
        <ImageWithFallback src={vet.photo} alt={`Portrait of ${name}`} icon={FaUserMd} ratio="4 / 5" />
        <span className="vet-years">{vet.yearsExperience} yrs exp.</span>
        {selected && (
          <span className="selected-check" aria-hidden="true">
            <FiCheck />
          </span>
        )}
      </div>
      <div className="vet-body">
        <span className="vet-specialty">{vet.specialty}</span>
        <h3 className="vet-name">{name}</h3>
        <RatingStars rating={vet.rating} count={vet.reviewCount} />
        <p className="vet-shift">
          <FiClock aria-hidden="true" /> {formatShift(vet)}
        </p>
        <DayChips days={vet.availableDays} />
        {note && <p className="vet-note">{note}</p>}
        {showActions && !onSelect && (
          <div className="vet-actions">
            <Button as={Link} to={`/vets/${vet.id}`} variant="outline-ink" size="sm">
              View profile
            </Button>
            <Button as={Link} to={`/owner/book?vet=${vet.id}`} variant="brand" size="sm">
              Book
            </Button>
          </div>
        )}
      </div>
      {onSelect && (
        <button type="button" className="stretched-select" onClick={() => onSelect(vet)} aria-pressed={selected} aria-label={`${name}, ${vet.specialty}`} />
      )}
    </article>
  );
}
