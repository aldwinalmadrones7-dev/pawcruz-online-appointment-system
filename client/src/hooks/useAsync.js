/**
 * useAsync — Runs an async loader (usually a service call) and tracks
 * { data, loading, error }. Re-runs when `deps` change or `reload()` is called,
 * ignores late responses from requests that are no longer current, and keeps the
 * previous data while refreshing so lists don't flash.
 * Pass simple values (ids, strings, booleans) in `deps`, like a useEffect dependency list.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsync(loader, deps = []) {
  const [reloadCount, setReloadCount] = useState(0);
  // Identifies the current request; `loading` is simply "the stored result is for an older key".
  const requestKey = JSON.stringify([...deps, reloadCount]);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const loaderRef = useRef(loader);

  // Always call the latest loader without re-running the request on every render.
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;
    loaderRef
      .current()
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (active) setResult((current) => ({ key: requestKey, data: current.data, error }));
      });
    return () => {
      active = false;
    };
  }, [requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  /** Updates the cached data locally (e.g. after a successful edit) without refetching. */
  const setData = useCallback(
    (updater) =>
      setResult((current) => ({
        ...current,
        data: typeof updater === 'function' ? updater(current.data) : updater,
      })),
    [],
  );

  const isCurrent = result.key === requestKey;
  return { data: result.data, loading: !isCurrent, error: isCurrent ? result.error : null, reload, setData };
}
