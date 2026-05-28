import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";
import type { ClientProfile } from "@/data/types";

/** Mask all but the last 4 digits of a phone number. Plus signs / spaces are
 *  stripped first so the count is over actual digits. */
function maskPhone(phone: string): { masked: string; last4: string } {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  const hiddenCount = Math.max(0, digits.length - 4);
  return { masked: `${"*".repeat(hiddenCount)}${last4}`, last4 };
}

interface Props {
  profile: ClientProfile | null;
  loading: boolean;
}

/** Read-only personal details (Phase 5.1, Task 3). Two-column on desktop,
 *  stacked on mobile via a CSS grid. Rendered as a description list (<dl>) so
 *  screen readers pair each label with its value. */
export function PersonalDetails({ profile, loading }: Props) {
  if (loading || !profile) {
    return (
      <section aria-labelledby="personal-details-heading" className="skeuo-card rounded-xl p-md">
        <SectionHeading id="personal-details-heading" />
        <div className="mt-md space-y-sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const { masked, last4 } = maskPhone(profile.phone);
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <section aria-labelledby="personal-details-heading" className="skeuo-card rounded-xl p-md">
      <SectionHeading id="personal-details-heading" />

      <dl className="mt-md grid grid-cols-1 gap-x-md md:grid-cols-[max-content_1fr]">
        <Row label="Full Name" value={fullName} />
        <Row label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
        <Row label="Email Address" value={profile.email} />
        <Row
          label="Phone Number"
          value={
            <span aria-label={`Phone number ending in ${last4}`} className="font-mono tracking-wider">
              {masked}
            </span>
          }
        />
        <Row label="Client ID" value={<span className="font-mono">{profile.clientId}</span>} />
        <Row label="Member Since" value={formatDate(profile.registeredAt)} />
        <Row label="Total Claims" value={String(profile.totalClaims)} />
        <Row
          label="Active Claims"
          value={
            <Link
              to="/claims"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {profile.activeClaims}
              <Icon name="arrow_forward" size={16} />
            </Link>
          }
        />
      </dl>

      <p className="mt-md flex items-start gap-1.5 border-t border-outline-variant/30 pt-sm font-body text-label font-normal text-on-surface-variant">
        <Icon name="info" size={16} className="mt-0.5 flex-none" />
        Need to update your details? Email us at{" "}
        <a href="mailto:contact@rowanrose.co.uk" className="text-primary hover:underline">
          contact@rowanrose.co.uk
        </a>{" "}
        or call{" "}
        <a href="tel:01615050150" className="text-primary hover:underline">
          0161 505 0150
        </a>
        .
      </p>
    </section>
  );
}

function SectionHeading({ id }: { id: string }) {
  return (
    <div>
      <h2 id={id} className="flex items-center gap-sm font-headline-md text-headline-md text-on-surface">
        <Icon name="person" size={22} className="text-primary" />
        Personal Details
      </h2>
      <p className="mt-1 font-body text-label font-normal text-on-surface-variant">
        To update your personal details, please contact us.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="border-t border-outline-variant/30 py-sm font-body text-label font-semibold text-on-surface-variant md:pr-md">
        {label}
      </dt>
      <dd className="-mt-1 border-outline-variant/30 pb-sm font-body text-body-md text-on-surface md:mt-0 md:border-t md:py-sm">
        {value}
      </dd>
    </div>
  );
}
