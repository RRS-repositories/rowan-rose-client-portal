import { Icon } from "@/components/ui/Icon";

/**
 * Trust block on /profile — surfaces firm credentials a regulated UK solicitor
 * is expected to display (SRA registration + companies-house number), plus a
 * couple of confidence signals (clients recovered to date, public review
 * rating). Numbers below are mocked at the moment; they'll be wired to a CMS
 * or env-driven config when the marketing site connects.
 */

// Mocked confidence signals — replace with live values when wired to a CMS.
const FIRM_WIDE_RECOVERED = "£12.4M+";
const REVIEW_RATING = 4.7;
const REVIEW_COUNT = 820;

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-px text-primary" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <Icon key={`f${i}`} name="star" size={16} fill />
      ))}
      {half && <Icon name="star_half" size={16} fill />}
      {Array.from({ length: empty }).map((_, i) => (
        <Icon key={`e${i}`} name="star_border" size={16} />
      ))}
    </span>
  );
}

export function AboutFirm() {
  return (
    <section aria-labelledby="about-firm-title" className="skeuo-card rounded-xl p-md">
      <div className="flex items-center gap-sm">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-tertiary-container text-on-tertiary-container skeuo-inner-highlight"
        >
          <Icon name="verified" size={20} fill />
        </span>
        <h2
          id="about-firm-title"
          className="font-headline-md text-headline-md text-on-surface"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          About Rowan Rose Solicitors
        </h2>
      </div>

      <p className="mt-sm font-body text-body-md text-on-surface-variant">
        A UK solicitors firm regulated by the SRA. We help clients recover money from unfair lending — no win, no fee.
      </p>

      <dl className="mt-md grid grid-cols-2 gap-sm">
        <div>
          <dt className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            SRA No.
          </dt>
          <dd className="mt-0.5 font-button text-body-md tabular-nums text-on-surface">8000843</dd>
        </div>
        <div>
          <dt className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            Company No.
          </dt>
          <dd className="mt-0.5 font-button text-body-md tabular-nums text-on-surface">12916452</dd>
        </div>
      </dl>

      <div className="mt-md rounded-lg bg-surface-container-lowest p-sm skeuo-inner-highlight">
        <p className="font-display-lg-mobile text-headline-md font-bold tabular-nums text-primary">
          {FIRM_WIDE_RECOVERED}
        </p>
        <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">
          Recovered for our clients to date.
        </p>
      </div>

      <div className="mt-md flex items-center gap-2 font-body text-label text-on-surface-variant">
        <StarRating value={REVIEW_RATING} />
        <span className="font-button text-body-md text-on-surface">{REVIEW_RATING}</span>
        <span>· {REVIEW_COUNT}+ reviews</span>
      </div>

      <a
        href="https://www.rowanrose.co.uk"
        target="_blank"
        rel="noreferrer"
        className="mt-md inline-flex min-h-[44px] items-center gap-1 font-body text-label-caps uppercase tracking-wide text-primary hover:underline"
      >
        Visit our website
        <Icon name="open_in_new" size={14} />
      </a>
    </section>
  );
}
