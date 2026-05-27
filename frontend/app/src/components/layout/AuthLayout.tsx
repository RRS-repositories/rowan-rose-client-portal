import { type ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { SettingsMenu } from "./SettingsMenu";

/**
 * Full-screen layout for the auth flow — a centred card on a faintly brand-washed
 * background, with the firm logo on top and a settings gear in the corner so
 * users can size up text or switch theme before they ever sign in (spec §1).
 * No sidebar / header — these routes are rendered bare by AppShell.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 55% at 50% 0%, rgb(var(--c-primary) / 0.10), transparent 70%)" }}
      />

      <div className="absolute right-4 top-4 z-10">
        <SettingsMenu />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-margin-mobile py-lg">
        <main className="skeuo-card w-full rounded-2xl p-8 md:p-10">
          <div className="mb-md flex justify-center">
            <Logo />
          </div>
          {children}
        </main>
        <p className="mt-md font-body text-label-caps uppercase tracking-wide text-on-surface-variant">
          © 2026 Rowan Rose Solicitors
        </p>
      </div>
    </div>
  );
}
