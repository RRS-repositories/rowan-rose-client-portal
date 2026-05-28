import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";

/**
 * Compact menu of common-but-rare account actions. Lives on the right column
 * of /profile so the page becomes a one-stop hub without crowding the main
 * Personal Details surface. Each row is ≥48px tall (touch-target floor).
 */

interface QuickLink {
  icon: string;
  label: string;
  /** Internal route — uses react-router Link. */
  to?: string;
  /** External or mailto — uses a plain <a>. */
  href?: string;
  /** Opens in a new tab when href is set. */
  external?: boolean;
}

const LINKS: QuickLink[] = [
  { icon: "help", label: "Help & FAQs", to: "/faq" },
  { icon: "download", label: "Download account statement", to: "/documents" },
  { icon: "share", label: "Refer a friend", to: "/profile" },
  { icon: "report", label: "Make a complaint about us", href: "mailto:complaints@rowanrose.co.uk?subject=Complaint%20about%20service" },
  { icon: "shield", label: "Privacy policy", href: "https://www.rowanrose.co.uk/privacy", external: true },
];

function Row({ link }: { link: QuickLink }) {
  const cls =
    "group flex min-h-[48px] items-center gap-sm py-2 font-body text-body-md text-on-surface transition-colors hover:text-primary";
  const body = (
    <>
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-surface-container-lowest text-primary skeuo-inner-highlight">
        <Icon name={link.icon} size={18} />
      </span>
      <span className="flex-1">{link.label}</span>
      <Icon
        name={link.external ? "open_in_new" : "chevron_right"}
        size={18}
        className="flex-none text-on-surface-variant transition-transform group-hover:translate-x-0.5"
      />
    </>
  );
  if (link.to) return <Link to={link.to} className={cls}>{body}</Link>;
  return (
    <a
      href={link.href}
      className={cls}
      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {body}
    </a>
  );
}

export function QuickLinks() {
  return (
    <section aria-labelledby="quick-links-title" className="skeuo-card rounded-xl p-md">
      <div className="flex items-center gap-sm">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-secondary-container text-on-secondary-container skeuo-inner-highlight"
        >
          <Icon name="bolt" size={20} fill />
        </span>
        <h2 id="quick-links-title" className="font-headline-md text-headline-md text-on-surface">
          Useful Actions
        </h2>
      </div>
      <ul className="mt-md divide-y divide-outline-variant/20">
        {LINKS.map((link) => (
          <li key={link.label}>
            <Row link={link} />
          </li>
        ))}
      </ul>
    </section>
  );
}
