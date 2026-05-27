import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS } from "./navItems";

/** Fixed bottom tab bar for mobile (<768px) — Stitch bottom nav. */
export function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="glass glass-top fixed inset-x-0 bottom-0 z-50 flex items-center justify-around rounded-t-xl px-4 pb-6 pt-3 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center rounded-xl transition-all",
              isActive
                ? "bg-primary-container px-4 py-2 text-on-primary-container shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                : "px-2 py-2 text-on-surface-variant opacity-80 hover:bg-surface-container-highest",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} size={24} fill={isActive} />
              <span className="mt-1 font-label-caps text-label-caps">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
