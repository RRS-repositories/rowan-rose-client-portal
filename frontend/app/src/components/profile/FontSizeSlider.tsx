import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import {
  FONT_PERCENT_MIN, FONT_PERCENT_MAX, FONT_PERCENT_STEP, FONT_PRESETS,
} from "@/theme/FontSizeProvider";

interface Props {
  percent: number;
  onChange: (percent: number) => void;
  className?: string;
}

const THUMB_PX = 20;
const HALF_THUMB = THUMB_PX / 2;

/**
 * Smooth text-size slider. A hidden native `<input type="range">` carries the
 * keyboard, drag, and screen-reader semantics; a custom thumb + track sit
 * inside a single inset wrapper so they all share one positioning coordinate
 * space — thumb, tick marks, and labels stay pixel-aligned at every value.
 *
 * Why a custom thumb — Webkit insets the native thumb's travel range by half
 * a thumb width when `-webkit-appearance: none` is set, so its coordinates
 * never quite match the visible track. Rendering our own thumb at the same
 * `left: percent%` position as the ticks sidesteps the quirk entirely.
 */
export function FontSizeSlider({ percent, onChange, className }: Props) {
  const sliderId = useId();
  const labelId = useId();
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const range = FONT_PERCENT_MAX - FONT_PERCENT_MIN;
  const fillPercent = range === 0 ? 0 : ((percent - FONT_PERCENT_MIN) / range) * 100;
  const activePreset = FONT_PRESETS.find((p) => p.value === percent) ?? null;

  return (
    <div className={className}>
      {/* Row 1 — small "Aa" cap · slider · large "Aa" cap */}
      <div className="flex items-center gap-md">
        <span aria-hidden className="font-display text-[16px] font-bold leading-none text-on-surface-variant select-none">
          Aa
        </span>

        <div className="relative h-11 flex-1">
          {/* Inset wrapper — single source of truth for the slider's
              horizontal coordinate space. Inset by HALF_THUMB so the thumb at
              0% / 100% has its centre exactly on the track edges. */}
          <div
            className="pointer-events-none absolute inset-y-0"
            style={{ left: HALF_THUMB, right: HALF_THUMB }}
          >
            {/* Decorative track + primary-coloured fill */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-container-highest skeuo-recessed"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-75 ease-out"
                style={{ width: `${fillPercent}%` }}
              />
            </div>

            {/* Tick markers — left:X% references the inset wrapper's width. */}
            <div aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2">
              {FONT_PRESETS.map((preset) => {
                const left = ((preset.value - FONT_PERCENT_MIN) / range) * 100;
                const passed = percent >= preset.value;
                return (
                  <span
                    key={preset.value}
                    className={cn(
                      "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-colors",
                      passed ? "bg-on-primary ring-primary" : "bg-surface-container-low ring-outline-variant/50",
                    )}
                    style={{ left: `${left}%`, top: "50%" }}
                  />
                );
              })}
            </div>

            {/* Custom thumb — same coordinate space as ticks, guaranteed aligned. */}
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-primary bg-primary shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-transform duration-75 ease-out",
                dragging && "scale-110",
                focused && "ring-4 ring-primary/30",
              )}
              style={{
                left: `${fillPercent}%`,
                width: THUMB_PX,
                height: THUMB_PX,
              }}
            />
          </div>

          {/* Hidden native input — owns interaction (drag, click, arrow keys,
              Home/End, screen-reader semantics). Spans the full column so
              clicks near the edges still register. */}
          <input
            id={sliderId}
            type="range"
            min={FONT_PERCENT_MIN}
            max={FONT_PERCENT_MAX}
            step={FONT_PERCENT_STEP}
            value={percent}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isNaN(next) && next !== percent) onChange(next);
            }}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-labelledby={labelId}
            aria-valuetext={activePreset ? `${percent} percent, ${activePreset.label}` : `${percent} percent`}
            className="absolute inset-0 z-20 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 focus:outline-none"
          />
        </div>

        <span aria-hidden className="font-display text-[28px] font-bold leading-none text-on-surface select-none">
          Aa
        </span>
      </div>

      {/* Row 2 — preset labels, same flex skeleton + inset as row 1 so labels
          sit under matching ticks. */}
      <div className="mt-1 flex gap-md" aria-hidden>
        <span className="invisible select-none font-display text-[16px] font-bold leading-none">Aa</span>
        <div className="relative h-5 flex-1">
          <div
            className="absolute inset-y-0"
            style={{ left: HALF_THUMB, right: HALF_THUMB }}
          >
            {FONT_PRESETS.map((preset, i) => {
              const left = ((preset.value - FONT_PERCENT_MIN) / range) * 100;
              const isFirst = i === 0;
              const isAtEnd = i === FONT_PRESETS.length - 1 && left >= 90;
              const active = percent === preset.value;
              return (
                <span
                  key={preset.value}
                  className={cn(
                    "absolute whitespace-nowrap font-label-caps text-label-caps uppercase tracking-wider transition-colors",
                    isFirst ? "" : isAtEnd ? "-translate-x-full" : "-translate-x-1/2",
                    active ? "font-bold text-primary" : "text-on-surface-variant",
                  )}
                  style={{ left: `${left}%` }}
                >
                  {preset.label}
                </span>
              );
            })}
          </div>
        </div>
        <span className="invisible select-none font-display text-[28px] font-bold leading-none">Aa</span>
      </div>

      {/* Hint + current value badge */}
      <div className="mt-md flex items-center justify-between gap-md">
        <span id={labelId} className="font-body text-label font-normal text-on-surface-variant">
          Drag to set your text size
        </span>
        <span
          aria-live="polite"
          className="flex-none rounded-full bg-primary/15 px-3 py-0.5 font-button text-button text-primary tabular-nums"
        >
          {percent}%{activePreset ? ` · ${activePreset.label}` : ""}
        </span>
      </div>
    </div>
  );
}
