import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { phaseOf } from "@/data/statusMap";
import type { Claim } from "@/data/types";

/** Header above the message list — identifies the active claim and (in the
 *  unified one-screen chat) lets the client switch to a different claim. The
 *  lender block is a button that re-opens the claim picker; the status pill
 *  stays as plain context. */
export function ChatHeader({ claim, onSwitch }: { claim: Claim; onSwitch?: () => void }) {
  return (
    <header className="flex items-center gap-sm border-b border-outline-variant/30 bg-surface-container-lowest px-md py-sm">
      <button
        type="button"
        onClick={onSwitch}
        aria-label={`Discussing ${claim.lender.name}, claim ${claim.id}. Switch claim.`}
        className="-mx-1 flex min-w-0 flex-1 items-center gap-sm rounded-xl px-1 py-1 text-left transition-colors hover:bg-surface-container-high focus-visible:bg-surface-container-high focus-visible:outline-none"
      >
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary skeuo-inner-highlight">
          <Icon name={claim.lender.icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate font-headline-md text-button font-bold text-on-surface">
              {claim.lender.name}
            </span>
            <Icon name="expand_more" size={18} className="flex-none text-on-surface-variant" />
          </span>
          <span className="block truncate font-body text-label text-on-surface-variant">Tap to switch claim</span>
        </span>
      </button>
      <StatusPill phase={phaseOf(claim)} />
    </header>
  );
}
