/**
 * RatingStars — Five-star rating with the score and review count ("New" when unrated).
 */
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';

export default function RatingStars({ rating = 0, count = 0 }) {
  if (!count) return <span className="rating is-new">New to PawCruz</span>;

  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="rating">
      <span className="stars" role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
        {[0, 1, 2, 3, 4].map((index) => {
          if (index < full) return <FaStar key={index} aria-hidden="true" />;
          if (index === full && half) return <FaStarHalfAlt key={index} aria-hidden="true" />;
          return <FaRegStar key={index} aria-hidden="true" />;
        })}
      </span>
      <strong>{rating.toFixed(1)}</strong>
      <span className="rating-count">({count} reviews)</span>
    </span>
  );
}
