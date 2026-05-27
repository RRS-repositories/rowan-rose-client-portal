const gbpFmt = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const gbp = (n: number): string => gbpFmt.format(n);

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const formatDate = (iso: string): string => longDate.format(new Date(iso));
export const formatDateShort = (iso: string): string => shortDate.format(new Date(iso));

export function relativeDays(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return "recently";
  const days = Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDateShort(iso);
}
