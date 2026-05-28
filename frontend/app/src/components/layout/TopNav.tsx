import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BellButton } from "./Chrome";
import { NAV_ITEMS } from "./navItems";

/** Desktop sticky top navigation (≥768px) — Stitch web app bar. */
export function TopNav() {
  return (
    <header className="glass sticky top-0 z-40 hidden md:block">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-margin-desktop py-md">
        <Link to="/dashboard" className="rounded-xl" aria-label="Rowan Rose Solicitors home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-gutter">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[48px] flex-col items-center justify-center rounded-xl px-4 py-2 transition-colors duration-150",
                  isActive
                    ? "bg-primary-container text-on-primary-container shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
                    : "text-on-surface-variant opacity-80 hover:bg-surface-container-highest hover:opacity-100",
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
        <div className="flex items-center gap-md">
          <ThemeToggle />
          <BellButton />
        </div>
      </div>
    </header>
  );
}
