import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { SettingsMenu } from "./SettingsMenu";
import { NotificationsMenu } from "./NotificationsMenu";
import { NAV_ITEMS } from "./navItems";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

/**
 * Desktop / tablet left navigation (≥768px) — file-folder tabs. The active tab
 * lifts out of a recessed track as a raised "folder tab" (primary accent); a
 * sliding indicator animates between them.
 *
 * Responsive width:
 *  - Tablet (768–1023px): collapsed to an icon rail; hovering or keyboard-focus
 *    expands it to full width as a flyout (overlays content — the `aside`
 *    placeholder keeps the rail's footprint, so the page doesn't reflow).
 *  - Desktop (≥1024px): always full width with labels.
 * Labels clip via `overflow-hidden` while collapsed and reveal as it widens.
 */
export function SideNav() {
  const { requestLogout } = useAuth();
  const { unreadCount } = useNotifications();
  return (
    <aside className="sticky top-0 z-40 hidden h-dvh flex-none md:block md:w-20 lg:w-[264px]">
      <div
        className={cn(
          "group/nav absolute inset-y-0 left-0 z-30 flex h-dvh w-20 flex-col gap-md overflow-hidden",
          "border-r border-outline-variant/30 bg-surface p-3 transition-[width] duration-200 ease-out",
          "hover:w-[264px] focus-within:w-[264px] hover:shadow-[8px_0_32px_rgba(0,0,0,0.18)]",
          // Desktop: drop the panel + border so the nav card and the footer
          // cards float separately on the ambient background — gives a clear
          // visual split between the top toggle and the bottom controls.
          "lg:w-[264px] lg:border-transparent lg:bg-transparent lg:p-md lg:shadow-none lg:hover:shadow-none",
          "motion-reduce:transition-none",
        )}
      >
        <Link to="/dashboard" className="flex items-center rounded-xl px-1 py-1" aria-label="Rowan Rose Solicitors home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="skeuo-recessed mt-2 flex flex-col gap-1 rounded-2xl bg-surface-container-low p-2 lg:border lg:border-outline-variant/40">
          {NAV_ITEMS.map((item) => {
            const badgeCount = item.badgeKey === "unread" ? unreadCount : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) =>
                  cn(
                    "relative flex min-h-[56px] items-center gap-sm rounded-xl px-3 font-button text-button transition-colors duration-200",
                    isActive ? "z-10 text-primary" : "text-on-surface-variant hover:text-on-surface",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidenav-active"
                        className="absolute inset-y-0 -right-2 left-0 rounded-xl rounded-r-md border-l-4 border-primary bg-surface-container-lowest skeuo-raise"
                        transition={{ type: "spring", stiffness: 400, damping: 36 }}
                      />
                    )}
                    <Icon name={item.icon} size={24} fill={isActive} className="relative z-10 flex-none" />
                    <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                    {badgeCount > 0 && (
                      <span
                        aria-label={`${badgeCount} unread`}
                        className="badge-3d relative z-10 ml-auto grid h-6 min-w-[24px] flex-none place-items-center rounded-full px-1.5 text-label-caps font-bold text-on-error-container"
                      >
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer — two SEPARATE recessed tracks. Appearance + notifications
            sit together; Log Out is on its own (it's a session/destructive
            action, not a control, so it shouldn't share the same card). */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="skeuo-recessed flex flex-col gap-2 rounded-2xl bg-surface-container-low p-2 lg:border lg:border-outline-variant/40">
            <SettingsMenu variant="row" placement="right-end" className="px-3" />

            <span className="mx-1 h-px bg-outline-variant/40" aria-hidden />

            <NotificationsMenu variant="row" placement="right-end" />
          </div>

          <div className="skeuo-recessed rounded-2xl bg-surface-container-low p-2 lg:border lg:border-outline-variant/40">
            <button
              type="button"
              onClick={requestLogout}
              className="flex w-full min-h-[48px] items-center gap-sm rounded-xl px-3 font-button text-button text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <Icon name="logout" size={22} className="flex-none" />
              <span className="whitespace-nowrap">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
