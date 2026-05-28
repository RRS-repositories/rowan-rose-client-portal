import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { phaseOf } from "@/data/statusMap";
import type { Claim } from "@/data/types";

/** Per-thread header sitting above the message list. The mobile back button is
 *  already rendered by the route's MobileHeader; this header is shown on the
 *  desktop pane (and as a sub-bar of the mobile chat for the StatusPill + ID). */
export function ChatHeader({ claim }: { claim: Claim }) {
  return (
    <header className="flex items-center gap-md border-b border-outline-variant/30 bg-surface-container-lowest px-md py-sm">
      <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-primary skeuo-inner-highlight">
        <Icon name={claim.lender.icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-headline-md text-button font-bold text-on-surface">
          {claim.lender.name}
        </h2>
        <p className="truncate font-mono text-label text-on-surface-variant">{claim.id}</p>
      </div>
      <StatusPill phase={phaseOf(claim)} />
    </header>
  );
}
