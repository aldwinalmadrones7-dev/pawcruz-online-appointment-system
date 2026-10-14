/**
 * usePolling — useAsync that keeps itself fresh: it reloads every `intervalMs` while the tab is
 * visible, right away when the tab becomes visible again, and after any appointment or queue
 * change made in this browser. The previous data stays on screen while it refreshes.
 * Used by the live queue boards.
 */
import { useEffect } from 'react';
import { APPOINTMENTS_CHANGED_EVENT } from '../utils/constants';
import useAsync from './useAsync';

export default function usePolling(loader, intervalMs, deps = []) {
  const query = useAsync(loader, deps);
  const { reload } = query;

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    const timer = window.setInterval(refreshIfVisible, intervalMs);
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener(APPOINTMENTS_CHANGED_EVENT, reload);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener(APPOINTMENTS_CHANGED_EVENT, reload);
    };
  }, [reload, intervalMs]);

  return query;
}
