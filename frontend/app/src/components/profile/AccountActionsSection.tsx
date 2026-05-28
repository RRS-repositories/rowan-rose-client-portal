import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/useToast";
import { useAuth } from "@/context/AuthContext";
import { logoutAllDevices, requestDataExport } from "@/api/profile";

interface Props {
  email: string | null;
}

/**
 * Account actions (Phase 5.1, Task 7). Both flows are UI-only stubs until the
 * real backend wiring lands — confirmed with Brad. Log Out Everywhere routes
 * through the existing AuthContext.logout(); Data Export shows a confirmation
 * + success toast and otherwise does nothing on the server.
 */
export function AccountActionsSection({ email }: Props) {
  const { logout } = useAuth();
  const { push } = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleLogoutAll() {
    setLoggingOut(true);
    try {
      await logoutAllDevices();
      push({ title: "All sessions have been ended", tone: "success" });
      setLogoutOpen(false);
      // Brief delay so the toast is visible before the redirect kicks in.
      window.setTimeout(() => logout("manual"), 400);
    } catch {
      push({ title: "Couldn't log out devices", description: "Please try again.", tone: "error" });
      setLoggingOut(false);
    }
  }

  async function handleDataExport() {
    setExporting(true);
    try {
      await requestDataExport();
      push({
        title: "Data request submitted",
        description: email
          ? `You will receive your data at ${email} within 30 days.`
          : "You will receive your data at your registered email within 30 days.",
        tone: "success",
      });
      setExportOpen(false);
    } catch {
      push({ title: "Couldn't submit your request", description: "Please try again.", tone: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <section aria-labelledby="account-heading" className="skeuo-card rounded-xl p-md">
      <div>
        <h2 id="account-heading" className="flex items-center gap-sm font-headline-md text-headline-md text-on-surface">
          <Icon name="tune" size={22} className="text-primary" />
          Account
        </h2>
      </div>

      <div className="mt-md space-y-md">
        {/* Log out everywhere */}
        <div className="flex flex-col items-start gap-sm border-b border-outline-variant/30 pb-md sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-button text-button text-on-surface">Log Out of All Devices</p>
            <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">
              Log out of all devices where you are currently signed in. You will need to log in again on this device.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setLogoutOpen(true)} className="flex-none">
            <span className="flex items-center gap-1.5">
              <Icon name="logout" size={18} />
              Log Out of All Devices
            </span>
          </Button>
        </div>

        {/* Data export */}
        <div className="flex flex-col items-start gap-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-button text-button text-on-surface">Request My Data</p>
            <p className="mt-0.5 font-body text-label font-normal text-on-surface-variant">
              Request a copy of all personal data we hold about you (GDPR Subject Access Request).
            </p>
          </div>
          <Button variant="secondary" onClick={() => setExportOpen(true)} className="flex-none">
            <span className="flex items-center gap-1.5">
              <Icon name="download" size={18} />
              Request My Data
            </span>
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        tone="danger"
        icon="logout"
        title="Log Out Everywhere"
        body="This will end all your active sessions, including this one. You will be redirected to the login page."
        confirmLabel="Yes, Log Out Everywhere"
        loading={loggingOut}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogoutAll}
      />

      <ConfirmModal
        open={exportOpen}
        tone="default"
        icon="download"
        title="Request My Data"
        body="We will prepare a copy of your data and send it to your registered email address within 30 days."
        confirmLabel="Request Data"
        loading={exporting}
        onCancel={() => setExportOpen(false)}
        onConfirm={handleDataExport}
      />
    </section>
  );
}
