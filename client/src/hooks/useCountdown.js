/**
 * useCountdown — Live days/hours/minutes/seconds until a timestamp (ticks every second).
 */
import { useEffect, useState } from 'react';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export default function useCountdown(targetTime) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetTime) return undefined;
    const timer = setInterval(() => setNow(Date.now()), SECOND);
    return () => clearInterval(timer);
  }, [targetTime]);

  const remaining = targetTime ? Math.max(0, targetTime - now) : 0;
  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
    isPast: Boolean(targetTime) && remaining === 0,
  };
}
