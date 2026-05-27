import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

export interface ThemeCtx {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeCtx | null>(null);

const KEY = "rr-theme";
const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolve = (t: Theme): Resolved => (t === "system" ? (systemDark() ? "dark" : "light") : t);
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(KEY) as Theme) || "system");
  const [resolved, setResolved] = useState<Resolved>(() => resolve(theme));

  const commit = useCallback((t: Theme) => {
    const r = resolve(t);
    document.documentElement.classList.toggle("dark", r === "dark");
    flushSync(() => {
      setThemeState(t);
      setResolved(r);
    });
  }, []);

  /**
   * Apply a theme. When animated, play a "VFD power-down": background snaps
   * instantly while text / borders / glows decay smoothly (phosphor lag).
   * The differential timing lives in the `.vfd` CSS class.
   */
  const applyTheme = useCallback(
    (t: Theme, animate = true) => {
      const root = document.documentElement;
      const wasDark = root.classList.contains("dark");
      const toDark = resolve(t) === "dark";

      if (!animate || prefersReduced() || wasDark === toDark) {
        commit(t);
        return;
      }

      root.classList.add("vfd");
      void root.offsetWidth; // arm the transitions before the value change
      commit(t); // .dark toggles → bg snaps, fg decays
      window.setTimeout(() => root.classList.remove("vfd"), 1120);
    },
    [commit],
  );

  const setTheme = useCallback(
    (t: Theme) => {
      localStorage.setItem(KEY, t);
      applyTheme(t, true);
    },
    [applyTheme],
  );

  useEffect(() => {
    // Seed the root `.dark` class on mount. State is already initialised from
    // localStorage, so there's nothing to set here — and using flushSync during
    // the initial lifecycle triggers a "flushSync from inside a lifecycle" warning.
    document.documentElement.classList.toggle("dark", resolve(theme) === "dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, applyTheme]);

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}
