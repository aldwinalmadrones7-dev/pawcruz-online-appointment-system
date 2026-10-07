/**
 * useDebounce — Returns `value` only after it has stopped changing for `delay` ms
 * (used so search boxes don't filter on every keystroke).
 */
import { useEffect, useState } from 'react';

export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
