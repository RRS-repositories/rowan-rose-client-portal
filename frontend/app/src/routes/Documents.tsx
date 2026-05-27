import { useRef } from "react";
import { Page } from "@/components/layout/Page";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { UploadZone, type UploadZoneHandle } from "@/components/upload/UploadZone";
import { RequirementRow, UploadedDocRow } from "@/components/upload/RequirementRow";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { formatDate } from "@/lib/format";

export default function Documents() {
  const { loading, data } = useMockQuery(getClient, "client");
  const uploadRef = useRef<UploadZoneHandle>(null);
  const outstanding = data?.requirements.filter((r) => !r.done) ?? [];

  return (
    <Page label="Documents">
      <MobileHeader variant="title" title="Documents" />
      <div className="w-full px-margin-mobile py-md md:px-lg md:py-lg">
        <header className="mb-md hidden md:block">
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface md:text-display-lg">Documents</h1>
          <p className="mt-xs max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
            Upload what we've asked for, or add anything you think helps your claim. Files stay private to your case.
          </p>
        </header>

        {/* Action needed — full width banner */}
        {!loading && data && outstanding.length > 0 && (
          <div className="skeuo-card mb-gutter flex items-start gap-sm rounded-xl border border-error-container/50 p-md">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-error-container text-on-error-container skeuo-inner-highlight">
              <Icon name="error" size={22} fill />
            </span>
            <div>
              <h2 className="mb-xs font-headline-md text-headline-md text-on-surface">Action Needed</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">You have {outstanding.length} {outstanding.length === 1 ? "item" : "items"} pending to complete your claim.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
          {/* Left: upload + recent uploads */}
          <div className="space-y-md lg:col-span-8">
            <section>
              <h3 className="mb-sm font-headline-md text-headline-md text-primary">Upload Documents</h3>
              <UploadZone ref={uploadRef} />
            </section>

            <section aria-labelledby="uploaded">
              <h3 id="uploaded" className="mb-sm font-headline-md text-headline-md text-primary">
                Recent Uploads {!loading && data ? `(${data.documents.length})` : ""}
              </h3>
              {loading || !data ? (
                <div className="space-y-sm"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
              ) : (
                <ul className="space-y-sm">
                  {data.documents.map((d) => <UploadedDocRow key={d.id} name={d.name} kind={d.kind} meta={`${d.sizeLabel} · Received ${formatDate(d.uploadedOn)}`} />)}
                </ul>
              )}
            </section>
          </div>

          {/* Right: requirements checklist (sticky on desktop) */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h3 className="mb-sm font-headline-md text-headline-md text-primary">
                Still Needed {!loading && data ? `(${outstanding.length})` : ""}
              </h3>
              {loading || !data ? (
                <div className="space-y-sm"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div>
              ) : outstanding.length === 0 ? (
                <div className="skeuo-card flex items-center gap-sm rounded-xl p-md">
                  <Icon name="task_alt" size={24} fill className="text-primary" />
                  <p className="font-body text-body-md text-on-surface">You're all caught up — nothing else needed right now.</p>
                </div>
              ) : (
                <ul className="space-y-sm">
                  {outstanding.map((r) => <RequirementRow key={r.id} requirement={r} onAction={() => uploadRef.current?.open()} />)}
                </ul>
              )}
            </div>
          </aside>
        </div>

        <LegalFooter />
      </div>
    </Page>
  );
}
