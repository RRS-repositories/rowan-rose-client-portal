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

function DocumentsSkeleton() {
  return (
    <div aria-hidden className="space-y-sm">
      <Skeleton className="h-12 w-full rounded-xl" />
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
    </div>
  );
}

export default function Documents() {
  const { loading, data, error, refetch } = useMockQuery(getClient, "client");
  const { push } = useToast();
  const [searchParams] = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [selectedType, setSelectedType] = useState<DocumentType | "">("");
  const [typeError, setTypeError] = useState<string | null>(null);
  // The specific requirement an upload should satisfy — set when launched from a
  // requirement card or a ?highlight=<id> deep link. Disambiguates per-lender
  // bank statements (same kind, different lenders).
  const [targetReqId, setTargetReqId] = useState<string | null>(null);

  const uploadRef = useRef<HTMLDivElement>(null);
  const uploadHandle = useRef<DocumentUploadHandle>(null);
  const appliedHighlight = useRef(false);

  // Seed local state from the query so uploads can update it optimistically.
  useEffect(() => {
    if (data) { setRequirements(data.requirements); setDocuments(data.documents); }
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

  function handleUploaded(doc: UploadedDoc, requirementUpdated: RequirementKind | null, lenderName?: string) {
    // Pick the requirement this upload satisfies. Bank statements carry the chosen
    // lender, so match on that; ID / Proof of Address are unique, so the sole
    // outstanding requirement of that kind (or the explicitly targeted one) wins.
    let satisfied: Requirement | undefined;
    if (requirementUpdated) {
      const candidates = requirements.filter((r) => !r.done && r.kind === requirementUpdated);
      satisfied = lenderName
        ? candidates.find((r) => r.lenderName === lenderName)
        : candidates.find((r) => r.id === targetReqId) ?? (candidates.length === 1 ? candidates[0] : undefined);
    }
    const effectiveLender = lenderName ?? satisfied?.lenderName;
    const finalDoc = effectiveLender ? { ...doc, lenderName: effectiveLender } : doc;
    setDocuments((cur) => [finalDoc, ...cur]);

    if (satisfied) {
      const { id, title } = satisfied;
      setRequirements((cur) => cur.map((r) => (r.id === id ? { ...r, done: true, receivedOn: new Date().toISOString() } : r)));
      push({ title: "Document uploaded", description: `Your ${title} has been marked as complete.`, tone: "success" });
    } else {
      push({ title: "Document uploaded", description: "Your document was uploaded successfully.", tone: "success" });
    }
    // Reset the form so the next upload re-asks the type — and a CRM-only type
    // (Bank Statement) can't linger as a selectable option once its trigger clears.
    setTargetReqId(null);
    setSelectedType("");
  }

  // Lenders on the client's account — offered when uploading a bank statement.
  const lenderNames = data ? Array.from(new Set(data.claims.map((c) => c.lender.name))) : [];
  // Bank statements are CRM-driven: the client can't pick "Bank Statement" on
  // their own. It's only offered when the upload was launched from a CRM
  // bank-statement requirement (card / ?highlight deep link), which sets the type
  // and a target requirement. Otherwise we drop it from the type list entirely.
  const bankStatementRequested = selectedType === "bank-statement" && !!targetReqId;
  const typeOptions = bankStatementRequested
    ? DOCUMENT_TYPES
    : DOCUMENT_TYPES.filter((t) => t.value !== "bank-statement");
  // When a bank-statement upload was launched for a specific lender (requirement
  // card / deep link), pre-select that lender in the staging form.
  const presetLender = bankStatementRequested
    ? requirements.find((r) => r.id === targetReqId)?.lenderName ?? ""
    : "";

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
            <p className="font-body-lg text-body-lg text-on-surface-variant">Send us what we've asked for, and review everything you've uploaded.</p>
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
                onUploaded={handleUploaded}
              />
            </section>

            <hr className="border-outline-variant/30" />

            <section aria-labelledby="docs-heading" className="space-y-md">
              <h2 id="docs-heading" className="font-headline-md text-headline-md text-primary">Your Documents</h2>
              {loading || !data ? <DocumentsSkeleton /> : <DocumentsList documents={documents} />}
            </section>
          </div>
        )}

        <LegalFooter />
      </Container>
    </Page>
  );
}
