import { useCallback, useEffect, useRef, useState } from "react";
import { fakeDelay } from "@/lib/fakeNetwork";

interface QueryState<T> { loading: boolean; data: T | null; error: string | null }
interface QueryResult<T> extends QueryState<T> { refetch: () => void }

/** Reads mock data behind a 600–1200ms fake delay so skeletons are real. If the
 *  getter throws, it surfaces as `error`; `refetch()` re-runs the query. */
export function useMockQuery<T>(getter: () => T, key: unknown = ""): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({ loading: true, data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const getterRef = useRef(getter);
  getterRef.current = getter;

  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: null });
    fakeDelay().then(() => {
      if (!active) return;
      try {
        setState({ loading: false, data: getterRef.current(), error: null });
      } catch (err) {
        setState({ loading: false, data: null, error: err instanceof Error ? err.message : "Something went wrong" });
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refetch };
}
