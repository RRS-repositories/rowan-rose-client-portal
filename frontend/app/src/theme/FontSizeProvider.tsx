import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

export type FontScale = "default" | "large" | "xlarge";

export interface FontSizeCtx {
  scale: FontScale;
  setScale: (s: FontScale) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const FontSizeContext = createContext<FontSizeCtx | null>(null);

const KEY = "rr-font-size";
const isScale = (v: unknown): v is FontScale => v === "default" || v === "large" || v === "xlarge";

/** Apply the scale to <html> via data-font-scale. "default" clears the attribute
 *  so the base 18px (17px ≤360px) rule applies; the rem type scale does the rest. */
function apply(scale: FontScale) {
  const root = document.documentElement;
  if (scale === "default") delete root.dataset.fontScale;
  else root.dataset.fontScale = scale;
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<FontScale>(() => {
    const stored = localStorage.getItem(KEY);
    return isScale(stored) ? stored : "default";
  });

  const setScale = useCallback((s: FontScale) => {
    localStorage.setItem(KEY, s);
    apply(s);
    setScaleState(s);
  }, []);

  useEffect(() => {
    apply(scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FontSizeContext.Provider value={{ scale, setScale }}>{children}</FontSizeContext.Provider>;
}
