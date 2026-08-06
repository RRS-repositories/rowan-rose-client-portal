import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Container } from "@/components/layout/AppShell";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/useToast";
import { RequirementsGrid } from "@/components/documents/RequirementsGrid";
import { DocumentUpload, type DocumentUploadHandle } from "@/components/documents/DocumentUpload";
import { DocumentsList } from "@/components/documents/DocumentsList";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
import { DOCUMENT_TYPES } from "@/config/upload";
import type { DocumentType, Requirement, RequirementKind, UploadedDoc } from "@/data/types";
// The page is upload-first, but keeps a RECEIPTS list ("What you've sent us") —
// the client's own portal uploads with a permanent Received tick. Reassurance
// for an audience that phones to ask "did you get my statements?"; never the
// firm's case files, and no downloads.

/** Requirement kind → the document type to pre-select on the upload form. */
const docTypeForKind = (kind: RequirementKind): DocumentType | "" =>
  kind === "id" ? "id" : kind === "address" ? "address" : kind === "bank-statements" ? "bank-statement" : "";

function RequirementsSkeleton() {
  return (
    <div aria-hidden className="space-y-md">
      <Skeleton className="h-7 w-72 rounded-lg" />
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function Documents() {
  const { loading, data, error, refetch } = useMockQuery(getClient, "client");
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [typeError, setTypeError] = useState<string | null>(null);
  // The specific requirement an upload should satisfy — set when launched from a
  // requirement card or a ?highlight=<id> deep link. Disambiguates per-lender
  // bank statements (same kind, different lenders).
  const [targetReqId, setTargetReqId] = useState<string | null>(null);
  // Receipts uploaded during THIS visit — merged ahead of the server list, and
  // deduped against it by (name, size) once re-hydration returns the DB rows.
  const [sessionDocs, setSessionDocs] = useState<UploadedDoc[]>([]);

  const uploadRef = useRef<HTMLDivElement>(null);
  const uploadHandle = useRef<DocumentUploadHandle>(null);
  const appliedHighlight = useRef(false);

  // Seed local state from the query so uploads can update it optimistically.
  // Only genuine upload asks render here — offer/signature/questionnaire/
  // extra-lender/FOS asks are actions elsewhere, never uploads.
  useEffect(() => {
    if (data) setRequirements(data.requirements.filter((r) => ["id", "address", "bank-statements"].includes(r.kind)));
  }, [data]);

  // Resolve a ?highlight=<requirementId> deep link once requirements load:
  // pre-select the type and target that requirement.
  useEffect(() => {
    if (appliedHighlight.current || !highlightParam || requirements.length === 0) return;
    const r = requirements.find((x) => x.id === highlightParam);
    if (!r) return;
    appliedHighlight.current = true;
    const dt = docTypeForKind(r.kind);
    if (dt) setSelectedType(dt);
    setTargetReqId(r.id);
  }, [highlightParam, requirements]);

  function handleTypeChange(v: DocumentType) {
    setSelectedType(v);
    setTypeError(null);
    setTargetReqId(null); // manual override — no specific requirement targeted
  }

  function handleRequirementUpload(r: Requirement) {
    const docType = docTypeForKind(r.kind);
    if (docType) setSelectedType(docType);
    setTargetReqId(r.id);
    setTypeError(null);
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => uploadHandle.current?.focusZone(), 320);
  }

  function handleUploaded(doc: UploadedDoc, requirementUpdated: RequirementKind | null) {
    // Show the new receipt immediately — the server copy arrives on next hydration.
    setSessionDocs((cur) => [doc, ...cur]);
    // Pick the requirement this upload satisfies: the targeted one if it matches,
    // else the sole outstanding requirement of that kind (ID / Proof of Address are
    // unique; multiple lender bank statements need an explicit target).
    let satisfied: Requirement | undefined;
    if (requirementUpdated) {
      const candidates = requirements.filter((r) => !r.done && r.kind === requirementUpdated);
      satisfied = candidates.find((r) => r.id === targetReqId) ?? (candidates.length === 1 ? candidates[0] : undefined);
    }

    if (satisfied) {
      const { id, title } = satisfied;
      setRequirements((cur) => cur.map((r) => (r.id === id ? { ...r, done: true, receivedOn: new Date().toISOString() } : r)));
      setTargetReqId(null);
      push({ title: "Document uploaded", description: `Your ${title} has been marked as complete.`, tone: "success" });
    } else {
      push({ title: "Document uploaded", description: "Your document was uploaded successfully.", tone: "success" });
    }
  }

  // Lenders on the client's account — offered when uploading a bank statement.
  const lenderNames = data ? Array.from(new Set(data.claims.map((c) => c.lender.name))) : [];
  // Bank Statement is CRM-driven: it's only offered when an upload was launched
  // from a bank-statement requirement (card / ?highlight deep link), which sets a
  // target. Otherwise it's dropped from the selectable types.
  const bankStatementRequested = selectedType === "bank-statement" && !!targetReqId;
  const typeOptions = bankStatementRequested
    ? DOCUMENT_TYPES
    : DOCUMENT_TYPES.filter((t) => t.value !== "bank-statement");
  const presetLender = bankStatementRequested
    ? requirements.find((r) => r.id === targetReqId)?.lenderName ?? ""
    : "";
  const presetClaimId = bankStatementRequested
    ? requirements.find((r) => r.id === targetReqId)?.claimId ?? ""
    : "";

  const receipts = [
    ...sessionDocs,
    ...(data?.documents ?? []).filter(
      (d) => !sessionDocs.some((s) => s.name === d.name && s.fileSize === d.fileSize),
    ),
  ];

  return (
    <Page label="Documents">
      <MobileHeader variant="title" title="Documents" />
      <Container>
        <header className="mb-md hidden items-center gap-sm md:flex">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-primary-container text-on-primary-container skeuo-inner-highlight">
            <Icon name="upload_file" size={26} fill />
          </span>
          <div>
            <h1 className="font-display-lg-mobile text-display-lg text-on-surface">Documents</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Send us what we've asked for.</p>
          </div>
        </header>

        {error ? (
          <EmptyState
            icon="error"
            title="Something went wrong"
            description="We couldn't load your documents. Please try again — if the problem continues, contact us at contact@rowanrose.co.uk."
            action={<Button variant="primary" leadingIcon="refresh" onClick={refetch}>Try Again</Button>}
          />
        ) : (
          <div className="space-y-lg">
            {loading || !data
              ? <RequirementsSkeleton />
              : <RequirementsGrid requirements={requirements} highlightId={highlightParam} onUpload={handleRequirementUpload} />}

            <hr className="border-outline-variant/30" />

            <section ref={uploadRef} aria-labelledby="upload-heading" className="scroll-mt-24 space-y-md">
              <h2 id="upload-heading" className="font-headline-md text-headline-md text-primary">Upload Documents</h2>
              <DocumentUpload
                ref={uploadHandle}
                documentType={selectedType}
                onTypeChange={handleTypeChange}
                typeError={typeError}
                typeOptions={typeOptions}
                onRequireType={() => setTypeError("Please choose a document type before uploading.")}
                lenderNames={lenderNames}
                presetLender={presetLender}
                presetClaimId={presetClaimId}
                onUploaded={handleUploaded}
              />
            </section>

            <hr className="border-outline-variant/30" />

            <section aria-labelledby="receipts-heading" className="space-y-md">
              <div>
                <h2 id="receipts-heading" className="font-headline-md text-headline-md text-primary">What You've Sent Us</h2>
                <p className="mt-1 font-body-lg text-body-md text-on-surface-variant">
                  A record of everything you've sent or signed through the portal — so you always know we've received it.
                </p>
              </div>
              <DocumentsList documents={receipts} />
            </section>
          </div>
        )}

        <LegalFooter />
      </Container>
    </Page>
  );
}
