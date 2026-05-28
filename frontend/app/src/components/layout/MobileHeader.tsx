import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { NotificationsMenu } from "./NotificationsMenu";
import { SettingsMenu } from "./SettingsMenu";

type Props =
  | { variant: "greeting"; greeting: string; subtitle: string }
  | { variant: "title"; title: string }
  | { variant: "back"; title: string; onBack?: () => void; backLabel?: string };

/** Mobile sticky header (<768px) — mirrors the per-screen Stitch top app bar.
 *  Back variant shows a back arrow; otherwise the title sits at the left edge
 *  (navigation lives in the bottom tab bar, so there's no hamburger). The right
 *  slot holds the settings gear and notification bell. The back action defaults
 *  to history navigate(-1); routes that have a known parent (e.g. /chat/:id →
 *  /chat) can pass `onBack` so direct URL loads still go to the right place. */
export function MobileHeader(props: Props) {
  const navigate = useNavigate();

  return (
    <header className="glass sticky top-0 z-40 flex items-center gap-sm px-margin-mobile py-base md:hidden">
      {props.variant === "back" && (
        <button
          onClick={props.onBack ?? (() => navigate(-1))}
          aria-label={props.backLabel ?? "Go back"}
          className="grid h-12 w-12 flex-none place-items-center rounded-full text-primary transition-colors hover:bg-surface-container-high skeuo-press"
        >
          <Icon name="arrow_back" size={24} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {props.variant === "greeting" ? (
          <>
            <h1 className="truncate font-display-lg-mobile text-[22px] font-bold leading-tight tracking-tight text-primary">{props.greeting}</h1>
            <p className="truncate font-body text-label font-normal text-on-surface-variant">{props.subtitle}</p>
          </>
        ) : (
          <h1 className="truncate font-headline-md text-headline-md font-bold tracking-tight text-primary">{props.title}</h1>
        )}
      </div>
      <div className="flex flex-none items-center gap-1">
        <SettingsMenu />
        <NotificationsMenu />
      </div>
    </header>
  );
}
