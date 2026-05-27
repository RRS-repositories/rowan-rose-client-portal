import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface EmptyStateProps { icon: string; title: string; description: string; action?: ReactNode }

/** Thoughtful empty state (brief §5.5 — never a blank panel). */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-sm px-4 py-12 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-on-surface-variant skeuo-recessed bg-surface-container-low">
        <Icon name={icon} size={32} />
      </span>
      <h2 className="mt-5 font-headline-md text-headline-md text-on-surface">{title}</h2>
      <p className="mt-2 font-body text-body-md text-on-surface-variant">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
