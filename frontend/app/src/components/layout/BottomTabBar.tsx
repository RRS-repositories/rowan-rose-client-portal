import { NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "./navItems";
import { useNotifications } from "@/context/NotificationContext";

/**
 * Fixed bottom tab bar for mobile (<768px). True skeuomorphism: the BAR is a
 * raised, convex panel (it bulges out) and each tab is a well DENTED into it.
 * The selected tab is a primary-lit well pressed in (it does NOT lift); a
 * shared-layout highlight glides socket-to-socket when you switch tabs. Inactive
 * tabs are neutral pressed-in wells. Active is never colour-alone (icon fills,
 * label bolds). Reduced-motion snaps instead of gliding.
 */
export function BottomTabBar() {
  const reduce = useReducedMotion();
  const { unreadCount } = useNotifications();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 px-2 md:hidden"
    >
      {/* Raised, bulging control panel — anchored to the bottom edge (rounded
          top, flush bottom) so there's no gap below it. The safe-area inset is
          padded INSIDE the panel, so its surface fills down to the screen edge. */}
      <div
        className="skeuo-card flex items-stretch gap-1.5 rounded-t-2xl px-1.5 pt-1.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.375rem)" }}
      >
        {NAV_ITEMS.map((item) => {
          const badgeCount = item.badgeKey === "unread" ? unreadCount : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors duration-200",
                  isActive ? "z-10 text-on-primary" : "text-on-surface-variant hover:text-on-surface",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Every tab is a well dented into the panel */}
                  {isActive ? (
                    <motion.span
                      layoutId="bottomtab-active"
                      aria-hidden
                      className="absolute inset-0 rounded-xl bg-primary skeuo-socket-active"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : (
                    <span aria-hidden className="absolute inset-0 rounded-xl bg-surface-container-low skeuo-recessed" />
                  )}
                  <span className="relative z-10">
                    <Icon name={item.icon} size={24} fill={isActive} />
                    {badgeCount > 0 && (
                      <span
                        aria-label={`${badgeCount} unread`}
                        className="badge-3d absolute -right-2 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none text-on-error-container"
                      >
                        {badgeCount}
                      </span>
                    )}
                  </span>
                  <span className={cn("relative z-10 font-label-caps text-label-caps", isActive && "font-bold")}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
