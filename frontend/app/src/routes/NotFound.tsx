import { useNavigate } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

/** Polished 404 — rendered inside the shell so navigation stays available. */
export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Page label="Page not found">
      <Container>
        <div className="grid min-h-[60dvh] place-items-center text-center">
          <div className="max-w-md">
            <p aria-hidden="true" className="font-display text-[88px] font-bold leading-none text-primary">
              404
            </p>
            <h1 className="mt-2 font-headline-md text-headline-md text-on-surface">Page not found</h1>
            <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
              The page you are looking for does not exist or has been moved.
            </p>
            <Button className="mt-lg" leadingIcon="arrow_back" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </Container>
    </Page>
  );
}
