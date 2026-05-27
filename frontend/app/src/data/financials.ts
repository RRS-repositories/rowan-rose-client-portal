import type { InternalStatus } from "./types";

export interface FeeBand { min: number; max: number; pct: number; cap: number }
export const FEE_BANDS: FeeBand[] = [
  { min: 1, max: 1499, pct: 0.3, cap: 420 },
  { min: 1500, max: 9999, pct: 0.28, cap: 2500 },
  { min: 10000, max: 24999, pct: 0.25, cap: 5000 },
  { min: 25000, max: 49999, pct: 0.2, cap: 7500 },
  { min: 50000, max: Infinity, pct: 0.15, cap: 10000 },
];
const VAT_RATE = 0.2;

export interface FeeBreakdown { gross: number; pct: number; cap: number; feeExVat: number; vat: number; feeIncVat: number; net: number }
export function computeFee(gross: number): FeeBreakdown {
  const band = FEE_BANDS.find((b) => gross >= b.min && gross <= b.max) ?? FEE_BANDS[FEE_BANDS.length - 1];
  const feeExVat = Math.min(gross * band.pct, band.cap);
  const vat = feeExVat * VAT_RATE;
  const feeIncVat = feeExVat + vat;
  return { gross, pct: band.pct, cap: band.cap, feeExVat, vat, feeIncVat, net: gross - feeIncVat };
}

/** Brief §8 progressive reveal. */
export type FinancialVisibility = "none" | "offerOnly" | "gross" | "full";
export function financialVisibility(status: InternalStatus): FinancialVisibility {
  switch (status) {
    case "Offer Received":
    case "Offer Accepted":
    case "Offer Rejected": return "offerOnly";
    case "Payment Received": return "gross";
    case "Fee Deducted":
    case "Client Paid": return "full";
    default: return "none";
  }
}
