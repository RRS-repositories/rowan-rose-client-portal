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
import { DocumentTypeSelector } from "@/components/documents/DocumentTypeSelector";
import { DocumentUpload, type DocumentUploadHandle } from "@/components/documents/DocumentUpload";
import { DocumentsList } from "@/components/documents/DocumentsList";
import { LegalFooter } from "./Dashboard";
import { useMockQuery } from "@/data/useMockQuery";
import { getClient } from "@/data/mock";
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

  function handleUploaded(doc: UploadedDoc, requirementUpdated: RequirementKind | null) {
    // Pick the requirement this upload satisfies: the targeted one if it matches,
    // else the sole outstanding requirement of that kind (ID / Proof of Address are
    // unique; multiple lender bank statements need an explicit target).
    let satisfied: Requirement | undefined;
    if (requirementUpdated) {
      const candidates = requirements.filter((r) => !r.done && r.kind === requirementUpdated);
      satisfied = candidates.find((r) => r.id === targetReqId) ?? (candidates.length === 1 ? candidates[0] : undefined);
    }
    const finalDoc = satisfied?.lenderName ? { ...doc, lenderName: satisfied.lenderName } : doc;
    setDocuments((cur) => [finalDoc, ...cur]);

    if (satisfied) {
      const { id, title } = satisfied;
      setRequirements((cur) => cur.map((r) => (r.id === id ? { ...r, done: true, receivedOn: new Date().toISOString() } : r)));
      setTargetReqId(null);
      push({ title: "Document uploaded", description: `Your ${title} has been marked as complete.`, tone: "success" });
    } else {
      push({ title: "Document uploaded", description: "Your document was uploaded successfully.", tone: "success" });
    }
  }

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
              <DocumentTypeSelector value={selectedType} onChange={handleTypeChange} error={typeError} />
              <DocumentUpload
                ref={uploadHandle}
                documentType={selectedType}
                onRequireType={() => setTypeError("Please choose a document type before uploading.")}
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
