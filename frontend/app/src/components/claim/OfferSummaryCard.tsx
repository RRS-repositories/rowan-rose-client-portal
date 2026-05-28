import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { gbp, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OfferDetails } from "@/data/offers";

/** Headline financial breakdown for the offer acceptance page. Uses a
 *  description list so screen readers read "Offer Amount: £3,480.00" etc. */
export function OfferSummaryCard({ offer }: { offer: OfferDetails }) {
  const expiry = useMemo(() => expiryStatus(offer.expiryDate), [offer.expiryDate]);

  return (
    <section
      className="skeuo-card rounded-xl p-md"
      aria-label="Settlement offer summary"
    >
      <header className="flex items-center gap-sm">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary-container text-on-primary-container skeuo-inner-highlight">
          <Icon name="receipt_long" size={20} fill />
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Settlement Offer</h2>
      </header>

      <dl className="mt-md space-y-3">
        <Row label="Offer Amount" value={gbp(offer.offerAmount)} valueClassName="font-display text-headline-md font-bold text-on-surface" />
        <Divider />
        <Row label={`Firm Fee (${offer.feePercentage}% + VAT)`} value={`- ${gbp(offer.estimatedFeeAmount)}`} valueClassName="font-body text-body-lg text-on-surface-variant" />
        <Divider />
        <Row label="Estimated to You" value={gbp(offer.estimatedNetToClient)} valueClassName="font-display text-headline-md font-bold text-primary" highlight />
      </dl>

      <dl className="mt-md grid grid-cols-1 gap-2 border-t border-outline-variant/30 pt-md text-body-md sm:grid-cols-2">
        <MetaRow label="Offer Reference" value={offer.offerReference} />
        <MetaRow label="Offer Date" value={formatDate(offer.offerDate)} />
        <MetaRow
          label="Expires"
          value={formatDate(offer.expiryDate)}
          valueClassName={cn(
            "font-body text-label",
            expiry.tone === "critical" && "text-error font-semibold",
            expiry.tone === "warning" && "text-on-tertiary-container font-semibold",
            expiry.tone === "ok" && "text-on-surface-variant",
          )}
          hint={expiry.label}
        />
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  valueClassName,
  highlight,
}: { label: string; value: string; valueClassName?: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-sm",
        highlight && "rounded-lg bg-primary-container/15 px-3 py-2",
      )}
    >
      <dt className="font-body text-body-md text-on-surface-variant">{label}</dt>
      <dd className={cn("text-right tabular-nums", valueClassName)}>{value}</dd>
    </div>
  );
}

function MetaRow({
  label,
  value,
  valueClassName,
  hint,
}: { label: string; value: string; valueClassName?: string; hint?: string }) {
  return (
    <div>
      <dt className="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">{label}</dt>
      <dd className={cn("mt-0.5 font-body text-label text-on-surface", valueClassName)}>
        {value}
        {hint && <span className="ml-1.5 font-body text-label font-normal opacity-80">({hint})</span>}
      </dd>
    </div>
  );
}

function Divider() {
  return <hr className="border-outline-variant/30" />;
}

function expiryStatus(expiryDate: string): { tone: "ok" | "warning" | "critical"; label: string } {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return { tone: "critical", label: "expired" };
  if (days <= 3) return { tone: "critical", label: `${days} day${days === 1 ? "" : "s"} left` };
  if (days <= 7) return { tone: "warning", label: `${days} days left` };
  return { tone: "ok", label: `${days} days left` };
}
