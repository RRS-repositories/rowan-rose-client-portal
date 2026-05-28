import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

const ACTIONS = [
  { to: "/documents", icon: "upload", label: "Upload Document", aria: "Upload a document" },
  { to: "/chat", icon: "forum", label: "View Messages", aria: "View your messages" },
] as const;

/** Two prominent shortcuts beneath the claims grid — large tap targets for older
 *  clients. Stacks full-width on mobile, side-by-side from sm up. */
export function QuickActions() {
  return (
    <nav aria-label="Quick actions" className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
      {ACTIONS.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          aria-label={a.aria}
          className="flex min-h-[56px] items-center gap-sm rounded-xl bg-surface-container-lowest p-sm font-button text-button text-on-surface skeuo-raise skeuo-press"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name={a.icon} size={22} />
          </span>
          {a.label}
        </Link>
      ))}
    </nav>
  );
}
