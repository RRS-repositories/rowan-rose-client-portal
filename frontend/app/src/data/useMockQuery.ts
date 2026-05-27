import { useEffect, useRef, useState } from "react";
import { fakeDelay } from "@/lib/fakeNetwork";

interface QueryState<T> { loading: boolean; data: T | null }

/** Reads mock data behind a 600–1200ms fake delay so skeletons are real. */
export function useMockQuery<T>(getter: () => T, key: unknown = ""): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ loading: true, data: null });
  const getterRef = useRef(getter);
  getterRef.current = getter;
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null });
    fakeDelay().then(() => {
      if (active) setState({ loading: false, data: getterRef.current() });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}
