import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Horizontal progress indicator for a multi-step flow. Circles connected by
 *  lines; completed = filled + check, current = ringed, future = muted.
 *  Labels hide below 480px to save room (spec). */
export function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <ol
      aria-label={`Step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]}`}
      className="flex items-start"
    >
      {steps.map((label, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        return (
          <li key={label} className="flex flex-1 flex-col items-center" aria-current={current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <Connector show={i > 0} solid={i <= currentStep} />
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-9 w-9 flex-none place-items-center rounded-full border-2 font-body text-label font-bold transition-colors",
                  done
                    ? "border-primary bg-primary text-on-primary"
                    : current
                      ? "scale-110 border-primary text-primary"
                      : "border-outline-variant text-on-surface-variant",
                )}
              >
                {done ? <Icon name="check" size={18} fill /> : i + 1}
              </span>
              <Connector show={i < steps.length - 1} solid={i < currentStep} />
            </div>
            <span
              className={cn(
                "mt-2 text-center font-label-caps text-label-caps uppercase tracking-wide max-[479px]:hidden",
                current ? "text-primary" : done ? "text-on-surface" : "text-on-surface-variant",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Connector({ show, solid }: { show: boolean; solid: boolean }) {
  if (!show) return <span className="flex-1" aria-hidden="true" />;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-0 flex-1 self-center border-t-2",
        solid ? "border-solid border-primary" : "border-dashed border-outline-variant",
      )}
    />
  );
}
