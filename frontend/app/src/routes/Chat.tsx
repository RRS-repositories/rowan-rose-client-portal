import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LegalFooter } from "./Dashboard";

export default function Chat() {
  return (
    <Page label="Messages">
      <MobileHeader variant="title" title="Messages" />
      <Container>
        <h1 className="mb-md hidden font-headline-md text-headline-md text-primary md:block">Messages</h1>
        <EmptyState
          icon="forum"
          title="No messages yet"
          description="When you or your case handler send a message, it'll appear here. You can also reach us any time by phone or email."
          action={<Button variant="secondary" leadingIcon="call" onClick={() => { window.location.href = "tel:01615050150"; }}>Call us on 0161 505 0150</Button>}
        />
        <LegalFooter />
      </Container>
    </Page>
  );
}
