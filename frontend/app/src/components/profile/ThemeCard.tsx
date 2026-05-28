import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import type { Theme } from "@/theme/ThemeProvider";

/** Hardcoded swatches for the mini preview — independent of the user's current
 *  theme so each card always shows its OWN look, even when not selected. */
const SWATCHES: Record<Theme, { bg: string; header: string; text: string; accent: string; mini: string }> = {
  light: { bg: "#FBFCF8", header: "#EFF1EA", text: "#1B1C18", accent: "#4A6447", mini: "#1B1C18" },
  dark: { bg: "#11140F", header: "#1A1D17", text: "#E3E3DC", accent: "#A8D696", mini: "#E3E3DC" },
  // System is rendered as a diagonal split so the user understands it follows the OS.
  system: { bg: "linear-gradient(135deg, #FBFCF8 50%, #11140F 50%)", header: "transparent", text: "transparent", accent: "transparent", mini: "transparent" },
};

interface Props {
  theme: Theme;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
  /** Arrow-key handler from the parent radiogroup. */
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Roving tabindex — only the selected card is in the tab order. */
  tabIndex: number;
}

/**
 * One theme option (Phase 5.1, Task 9). role="radio" inside the parent
 * radiogroup. Selecting applies the theme immediately via setTheme(); the
 * page-wide crossfade is owned by ThemeProvider.
 */
export function ThemeCard({ theme, label, description, isSelected, onSelect, onKeyDown, tabIndex }: Props) {
  const s = SWATCHES[theme];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label} theme — ${description}`}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "skeuo-card relative flex w-full flex-col items-stretch gap-sm rounded-xl p-sm text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-outline-variant",
      )}
    >
      {/* Mini preview */}
      <div className="relative h-20 overflow-hidden rounded-lg border border-outline-variant/20" style={{ background: s.bg }}>
        {theme !== "system" && (
          <>
            <div className="h-3 w-full" style={{ background: s.header }} />
            <div className="space-y-1 p-2">
              <div className="h-1.5 w-3/4 rounded-full opacity-80" style={{ background: s.text }} />
              <div className="h-1.5 w-1/2 rounded-full opacity-60" style={{ background: s.text }} />
              <div className="h-1.5 w-2/3 rounded-full opacity-60" style={{ background: s.text }} />
            </div>
            <span
              className="absolute bottom-1.5 right-1.5 inline-block h-3 w-3 rounded-full"
              style={{ background: s.accent }}
            />
          </>
        )}
        {theme === "system" && (
          // Show "Auto" hint on the system option since the preview is just a split.
          <div className="grid h-full place-items-center font-button text-button text-on-surface mix-blend-difference">
            Auto
          </div>
        )}
      </div>

      {/* Label + description */}
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <p className="font-button text-button text-on-surface">{label}</p>
          <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">{description}</p>
        </div>
        {isSelected && (
          <span aria-hidden className="grid h-6 w-6 flex-none place-items-center rounded-full bg-primary text-on-primary">
            <Icon name="check" size={16} fill />
          </span>
        )}
      </div>
    </button>
  );
}
