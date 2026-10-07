/**
 * CountdownTimer — Days / hours / minutes / seconds until a given moment.
 */
import useCountdown from '../hooks/useCountdown';

export default function CountdownTimer({ target }) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(target);

  if (isPast) return <p className="countdown-done">It's time — see you at the clinic!</p>;

  const parts = [
    { label: 'days', value: days },
    { label: 'hrs', value: hours },
    { label: 'min', value: minutes },
    { label: 'sec', value: seconds },
  ];

  return (
    <div className="countdown" role="timer" aria-label={`${days} days, ${hours} hours and ${minutes} minutes to go`}>
      {parts.map((part) => (
        <div key={part.label} className="countdown-part" aria-hidden="true">
          <span className="countdown-value">{String(part.value).padStart(2, '0')}</span>
          <span className="countdown-label">{part.label}</span>
        </div>
      ))}
    </div>
  );
}
