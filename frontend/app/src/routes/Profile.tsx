import { Link } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/layout/Chrome";
import { LegalFooter } from "./Dashboard";
import { getClient } from "@/data/mock";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-outline-variant/30 py-sm first:border-t-0">
      <dt className="font-body text-body-md text-on-surface-variant">{label}</dt>
      <dd className="font-button text-button text-on-surface">{value}</dd>
    </div>
  );
}

export default function Profile() {
  const client = getClient();
  return (
    <Page label="Profile">
      <MobileHeader variant="title" title="Profile" />
      <Container>
        <header className="mb-md flex items-center gap-md">
          <Avatar initials={`${client.firstName[0]}${client.lastName[0]}`} />
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">{client.firstName} {client.lastName}</h1>
            <p className="font-body text-label font-normal text-on-surface-variant">Client {client.id}</p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <Card className="p-md lg:col-span-2">
            <h2 className="mb-sm font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Your details</h2>
            <dl>
              <Detail label="Full name" value={`${client.firstName} ${client.lastName}`} />
              <Detail label="Client reference" value={client.id} />
              <Detail label="Email" value="sarah.holden@example.com" />
              <Detail label="Phone" value="07700 900123" />
            </dl>
            <p className="mt-sm flex items-center gap-1.5 font-body text-label font-normal text-on-surface-variant">
              <Icon name="lock" size={16} />
              To change your details, please contact us — we'll update them securely.
            </p>
          </Card>
          <div className="space-y-md lg:col-span-1">
            <Card className="p-md">
              <h2 className="mb-sm font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">Appearance</h2>
              <div className="flex flex-col gap-sm">
                <div>
                  <p className="font-button text-button text-on-surface">Theme</p>
                  <p className="font-body text-label font-normal text-on-surface-variant">Light, dark, or match your device.</p>
                </div>
                <ThemeToggle />
              </div>
            </Card>
            <Link to="/faq" className="skeuo-card skeuo-press flex min-h-[56px] items-center justify-between gap-sm rounded-xl p-md">
              <span className="flex items-center gap-sm">
                <Icon name="help" size={22} className="text-primary" />
                <span className="font-button text-button text-on-surface">Help &amp; FAQs</span>
              </span>
              <Icon name="chevron_right" size={22} className="text-on-surface-variant" />
            </Link>
            <p className="flex items-start gap-1.5 font-body text-label font-normal text-on-surface-variant">
              <Icon name="info" size={16} />
              Password, notification preferences and large-text mode are coming soon.
            </p>
          </div>
        </div>
        <LegalFooter />
      </Container>
    </Page>
  );
}
