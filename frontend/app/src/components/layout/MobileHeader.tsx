import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { BellButton } from "./Chrome";
import { SettingsMenu } from "./SettingsMenu";
import { MobileDrawer } from "./MobileDrawer";

type Props =
  | { variant: "greeting"; greeting: string; subtitle: string }
  | { variant: "title"; title: string }
  | { variant: "back"; title: string };

/** Mobile sticky header (<768px) — mirrors the per-screen Stitch top app bar.
 *  Left slot is a back arrow (back variant) or the hamburger that opens the
 *  navigation drawer; right slot holds the settings gear and notification bell. */
export function MobileHeader(props: Props) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="glass sticky top-0 z-40 flex items-center gap-sm px-margin-mobile py-base md:hidden">
        {props.variant === "back" ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-12 w-12 flex-none place-items-center rounded-full text-primary transition-colors hover:bg-surface-container-high skeuo-press"
          >
            <Icon name="arrow_back" size={24} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            className="grid h-12 w-12 flex-none place-items-center rounded-full text-primary transition-colors hover:bg-surface-container-high skeuo-press"
          >
            <Icon name="menu" size={24} />
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
          <BellButton />
        </div>
      </header>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
