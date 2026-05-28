import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { useTheme } from "@/theme/useTheme";
import { useFontSize } from "@/theme/useFontSize";
import type { Theme } from "@/theme/ThemeProvider";
import { ThemeCard } from "./ThemeCard";
import { FontSizeSlider } from "./FontSizeSlider";

const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Default bright theme" },
  { value: "dark", label: "Dark", description: "Easier on the eyes in low light" },
  { value: "system", label: "System", description: "Match your device setting" },
];

function rove<T>(items: readonly T[], currentIndex: number, direction: 1 | -1): number {
  const n = items.length;
  return (currentIndex + direction + n) % n;
}

/**
 * Appearance & Accessibility (Phase 5.1, Task 6). Theme cards on top, then a
 * horizontal scroll-snap dialer for text size — swipe / drag / arrow-key,
 * snaps to one of three detents. The standalone SettingsPanel (header gear)
 * keeps working unchanged; both write to the same providers, so the controls
 * stay in sync.
 */
export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { percent, setPercent } = useFontSize();
  const themeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function onThemeKeyDown(e: React.KeyboardEvent, current: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = rove(THEME_OPTIONS, current, 1);
      setTheme(THEME_OPTIONS[next].value);
      themeRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = rove(THEME_OPTIONS, current, -1);
      setTheme(THEME_OPTIONS[next].value);
      themeRefs.current[next]?.focus();
    }
  }

  return (
    <section aria-labelledby="appearance-heading" className="skeuo-card rounded-xl p-md">
      <div>
        <h2 id="appearance-heading" className="flex items-center gap-sm font-headline-md text-headline-md text-on-surface">
          <Icon name="palette" size={22} className="text-primary" />
          Appearance &amp; Accessibility
        </h2>
        <p className="mt-1 font-body text-label font-normal text-on-surface-variant">
          Customise the look and feel of your portal.
        </p>
      </div>

      {/* Theme */}
      <div className="mt-md">
        <h3 className="font-button text-button text-on-surface">Theme</h3>
        <div
          role="radiogroup"
          aria-label="Colour theme"
          className="mt-sm grid grid-cols-1 gap-sm sm:grid-cols-3"
        >
          {THEME_OPTIONS.map((opt, i) => (
            <div key={opt.value} ref={(el) => { themeRefs.current[i] = el?.querySelector("button") ?? null; }}>
              <ThemeCard
                theme={opt.value}
                label={opt.label}
                description={opt.description}
                isSelected={theme === opt.value}
                onSelect={() => setTheme(opt.value)}
                onKeyDown={(e) => onThemeKeyDown(e, i)}
                tabIndex={theme === opt.value ? 0 : -1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Text size — smooth slider, 100–160% in 5% steps. */}
      <div className="mt-md">
        <h3 className="font-button text-button text-on-surface">Text Size</h3>
        <div className="mt-sm">
          <FontSizeSlider percent={percent} onChange={setPercent} />
        </div>

        {/* Live preview line — already scaled by the global data-font-scale rule. */}
        <p
          aria-live="polite"
          className="mt-sm rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-sm font-body text-body-md text-on-surface"
        >
          This is how text will appear across the portal.
        </p>
      </div>

      <p className="mt-md flex items-start gap-1.5 border-t border-outline-variant/30 pt-sm font-body text-label font-normal text-on-surface-variant">
        <Icon name="info" size={16} className="mt-0.5 flex-none text-primary" />
        Your preferences are saved automatically and will be remembered next time you visit.
      </p>
    </section>
  );
}
