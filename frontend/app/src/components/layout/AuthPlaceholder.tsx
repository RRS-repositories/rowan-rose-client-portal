import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

/** Full-screen branded placeholder for the auth routes (Phase 1.3 / 1.4 build
 *  these out). Rendered outside AppShell — its own centred layout, theme-safe. */
export function AuthPlaceholder({ icon, title, phase }: { icon: string; title: string; phase: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-margin-mobile py-lg">
      <div className="w-full max-w-md text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid h-16 w-16 place-items-center rounded-xl bg-primary text-2xl font-bold text-on-primary skeuo-raise"
          style={{ fontFamily: "var(--font-display)" }}
        >
          RR
        </span>
        <p className="mt-3 font-body text-label-caps uppercase tracking-[0.16em] text-on-surface-variant">
          Rowan Rose · Fast Action Claims
        </p>

        <span className="mx-auto mt-lg grid h-14 w-14 place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
          <Icon name={icon} size={28} fill />
        </span>
        <h1 className="mt-md font-display-lg-mobile text-display-lg-mobile font-bold text-on-surface">{title}</h1>
        <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">{phase}</p>

        <Link
          to="/dashboard"
          className="mt-lg inline-flex min-h-[48px] items-center gap-sm rounded-full px-6 font-button text-button text-primary transition-colors hover:bg-primary/10"
        >
          <Icon name="arrow_back" size={20} /> Back to portal
        </Link>
      </div>
    </div>
  );
}
