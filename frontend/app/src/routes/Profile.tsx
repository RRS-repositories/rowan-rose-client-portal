import { useCallback, useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Icon } from "@/components/ui/Icon";
import { PersonalDetails } from "@/components/profile/PersonalDetails";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";
import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";
import { AppearanceSection } from "@/components/profile/AppearanceSection";
import { AccountActionsSection } from "@/components/profile/AccountActionsSection";
import { ProgressAtGlance } from "@/components/profile/ProgressAtGlance";
import { QuickLinks } from "@/components/profile/QuickLinks";
import { AboutFirm } from "@/components/profile/AboutFirm";
import { LegalFooter } from "./Dashboard";
import { getClientProfile, getNotificationPreferences } from "@/api/profile";
import type { ClientProfile, NotificationPreferences } from "@/data/types";

/**
 * /profile — Phase 5.1. Top-to-bottom composition of the five sections
 * specified by the brief. Profile + preferences are fetched in parallel on
 * mount; each section owns its own loading skeleton so the page paints
 * progressively. The Appearance section talks directly to ThemeProvider /
 * FontSizeProvider, so its data isn't part of the fetch.
 */
export default function Profile() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const p = await getClientProfile();
      setProfile(p);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    let cancelled = false;
    (async () => {
      try {
        const p = await getNotificationPreferences();
        if (!cancelled) setPrefs(p);
      } finally {
        if (!cancelled) setPrefsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadProfile]);

  return (
    <Page label="My Profile">
      <MobileHeader variant="title" title="My Profile" />
      <Container>
        <header className="mb-md flex items-center gap-sm">
          <Icon name="person" size={32} className="text-primary" />
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface md:text-display-lg">
            My Profile
          </h1>
        </header>

        {/* Two-column on desktop: main account sections on the left, summary +
            useful actions + firm-trust cards in a sticky right rail. Mobile /
            tablet collapse to one column so the right cards stack below. */}
        <div className="grid gap-md lg:grid-cols-12 lg:gap-gutter">
          <div className="space-y-md lg:col-span-8">
            <PersonalDetails profile={profile} loading={profileLoading} />
            <ChangePasswordSection
              passwordLastChanged={profile?.passwordLastChanged ?? null}
              onChanged={loadProfile}
              loading={profileLoading}
            />
            <NotificationPreferencesSection initialPrefs={prefs} loading={prefsLoading} />
            <AppearanceSection />
            <AccountActionsSection email={profile?.email ?? null} />
          </div>

          <aside className="space-y-md lg:col-span-4">
            <ProgressAtGlance />
            <QuickLinks />
            <AboutFirm />
          </aside>
        </div>

        <LegalFooter />
      </Container>
    </Page>
  );
}
