import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/useToast";
import { uploadDocument } from "@/api/documents";
import { validateFile, formatFileSize } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME, ACCEPT_HINT, MAX_FILES_PER_UPLOAD } from "@/config/upload";
import type { DocumentType, RequirementKind, UploadedDoc } from "@/data/types";
import { DocumentTypeSelector } from "./DocumentTypeSelector";
import { LenderSelector } from "./LenderSelector";
import { UploadProgress, type UploadItem } from "./UploadProgress";

interface Props {
  documentType: DocumentType | "";
  /** Controlled type value lives in the parent (for requirement matching). */
  onTypeChange: (value: DocumentType) => void;
  typeError: string | null;
  /** Selectable document types — the parent hides Bank Statement unless the CRM asked. */
  typeOptions: ReadonlyArray<{ value: DocumentType; label: string }>;
  /** Called when the user confirms with no type chosen. */
  onRequireType: () => void;
  /** Lenders on the client's account — offered when the type is Bank Statement. */
  lenderNames: string[];
  /** Pre-selected lender (deep link / requirement card for a specific lender). */
  presetLender?: string;
  /** Called once a file finishes uploading (optimistic list + requirement update).
   *  lenderName is set for bank statements so the right per-lender requirement clears. */
  onUploaded: (doc: UploadedDoc, requirementUpdated: RequirementKind | null, lenderName?: string) => void;
}

export interface DocumentUploadHandle { focusZone: () => void }

const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS, ...ACCEPTED_MIME].join(",");

type DragState = "none" | "valid" | "invalid";
interface StagedFile { id: number; file: File }

/** Drag-and-drop zone → staging → upload. Files are dropped/browsed first; only
 *  then do we ask what type they are (and, for bank statements, which lender),
 *  and start uploading on confirm. Progress is simulated client-side, then the
 *  mock API is called at 100%. */
export const DocumentUpload = forwardRef<DocumentUploadHandle, Props>(function DocumentUpload(
  { documentType, onTypeChange, typeError, typeOptions, onRequireType, lenderNames, presetLender, onUploaded },
  ref,
) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const stagePanelRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const timers = useRef<Map<number, number>>(new Map());
  const progressRef = useRef<Map<number, number>>(new Map());
  const pending = useRef<Map<number, { file: File; type: DocumentType; lenderName?: string }>>(new Map());

  const [drag, setDrag] = useState<DragState>("none");
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [bankLender, setBankLender] = useState("");
  const [lenderError, setLenderError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [live, setLive] = useState("");
  const { push } = useToast();

  useImperativeHandle(ref, () => ({ focusZone: () => zoneRef.current?.focus() }), []);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  // Seed the lender from a deep link / per-lender requirement when staging a
  // bank statement; clear lender state whenever the type isn't a bank statement.
  useEffect(() => {
    if (documentType !== "bank-statement") {
      setBankLender("");
      setLenderError(null);
    } else if (presetLender) {
      setBankLender(presetLender);
    }
  }, [documentType, presetLender]);

  // When files first land, move focus into the staging panel so keyboard users
  // are taken straight to the "what type is this?" question.
  useEffect(() => {
    if (staged.length > 0) stagePanelRef.current?.querySelector("select")?.focus();
  }, [staged.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearTimer(id: number) {
    const t = timers.current.get(id);
    if (t != null) window.clearTimeout(t);
    timers.current.delete(id);
  }

  function removeItem(id: number) {
    clearTimer(id);
    pending.current.delete(id);
    progressRef.current.delete(id);
    setUploads((cur) => cur.filter((u) => u.id !== id));
  }

  async function finish(id: number) {
    const entry = pending.current.get(id);
    if (!entry) return;
    try {
      const res = await uploadDocument(entry.file, entry.type);
      setUploads((cur) => cur.map((u) => (u.id === id ? { ...u, status: "done", progress: 100 } : u)));
      setLive(`${entry.file.name} uploaded successfully.`);
      onUploaded(res.document, res.requirementUpdated, entry.lenderName);
      clearTimer(id);
      timers.current.set(id, window.setTimeout(() => removeItem(id), 3000));
    } catch {
      setUploads((cur) => cur.map((u) => (u.id === id ? { ...u, status: "error", error: "Upload failed. Please try again." } : u)));
      setLive(`${entry.file.name} failed to upload.`);
    }
  }

  function tick(id: number) {
    const current = progressRef.current.get(id) ?? 0;
    const next = Math.min(100, current + 8 + Math.random() * 14);
    progressRef.current.set(id, next);
    setUploads((cur) => cur.map((u) => (u.id === id && u.status === "uploading" ? { ...u, progress: next } : u)));
    if (next >= 100) {
      timers.current.set(id, window.setTimeout(() => finish(id), 300));
    } else {
      timers.current.set(id, window.setTimeout(() => tick(id), 220 + Math.random() * 260));
    }
  }

  function startSim(id: number) {
    progressRef.current.set(id, 0);
    timers.current.set(id, window.setTimeout(() => tick(id), 200));
  }

  /** Stage dropped/browsed files — validate now, ask for the type next. */
  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    if (staged.length + arr.length > MAX_FILES_PER_UPLOAD) {
      push({ title: "Too many files", description: `You can upload a maximum of ${MAX_FILES_PER_UPLOAD} files at once.`, tone: "error" });
      return;
    }
    const accepted: StagedFile[] = [];
    arr.forEach((file) => {
      const { valid, error } = validateFile(file);
      if (!valid) {
        push({ title: "We couldn't add that file", description: error ?? "That file isn't accepted.", tone: "error" });
        return;
      }
      accepted.push({ id: ++seq.current, file });
    });
    if (accepted.length === 0) return;
    setStaged((cur) => [...cur, ...accepted]);
    setLive(`${accepted.length} file${accepted.length === 1 ? "" : "s"} added. Please tell us what type of document ${accepted.length === 1 ? "it is" : "they are"}.`);
  }

  function removeStaged(id: number) {
    setStaged((cur) => cur.filter((s) => s.id !== id));
  }

  function clearStaged() {
    setStaged([]);
    setBankLender("");
    setLenderError(null);
    setLive("Upload cancelled.");
  }

  /** Confirm the staged files: validate the type (and lender), then upload. */
  function startUploads() {
    if (!documentType) { onRequireType(); return; }
    const isBank = documentType === "bank-statement";
    if (isBank && !bankLender) {
      setLenderError("Please choose which lender this statement is for.");
      return;
    }
    const lenderName = isBank ? bankLender : undefined;
    staged.forEach(({ id, file }) => {
      pending.current.set(id, { file, type: documentType, lenderName });
      setUploads((cur) => [...cur, { id, name: file.name, fileSize: file.size, mime: file.type, progress: 0, status: "uploading" }]);
      startSim(id);
    });
    setLive(`Uploading ${staged.length} document${staged.length === 1 ? "" : "s"}.`);
    setStaged([]);
    setBankLender("");
    setLenderError(null);
  }

  function cancel(id: number) {
    const wasUploading = uploads.find((u) => u.id === id)?.status === "uploading";
    removeItem(id);
    if (wasUploading) {
      push({ title: "Upload cancelled", tone: "info" });
      setLive("Upload cancelled.");
    }
  }

  function retry(id: number) {
    if (!pending.current.get(id)) return;
    setUploads((cur) => cur.map((u) => (u.id === id ? { ...u, status: "uploading", progress: 0, error: undefined } : u)));
    setLive(`Retrying ${pending.current.get(id)?.file.name ?? "upload"}.`);
    startSim(id);
  }

  function inspectDrag(e: React.DragEvent): DragState {
    const items = e.dataTransfer?.items;
    if (!items || items.length === 0) return "valid";
    let known = false, bad = false;
    for (const it of Array.from(items)) {
      if (it.kind !== "file" || !it.type) continue;
      known = true;
      if (!ACCEPTED_MIME.includes(it.type)) bad = true;
    }
    return known && bad ? "invalid" : "valid";
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <div
        ref={zoneRef}
        role="button"
        tabIndex={0}
        aria-label="Upload documents. Drag and drop files here or press Enter to browse."
        onClick={openPicker}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(inspectDrag(e)); }}
        onDragLeave={() => setDrag("none")}
        onDrop={(e) => { e.preventDefault(); setDrag("none"); addFiles(e.dataTransfer.files); }}
        className={cn(
          "skeuo-tray flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-lg text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          drag === "valid" && "border-primary bg-primary/5",
          drag === "invalid" && "border-error bg-error/5",
          drag === "none" && "border-outline-variant/40 bg-surface-container-low",
        )}
      >
        <motion.span
          className="relative mb-sm grid h-16 w-16 place-items-center"
          animate={drag === "valid" ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          aria-hidden
        >
          <Icon name="cloud_upload" size={56} fill className={drag === "invalid" ? "text-error" : "text-primary"} />
        </motion.span>
        <p className="font-body-lg text-body-lg text-on-surface">
          {drag === "invalid" ? "File type not accepted" : drag === "valid" ? "Drop your files here" : "Drag and drop your files here"}
        </p>
        {drag === "none" && <p className="mt-xs font-body text-body-md text-on-surface-variant">or</p>}
        {/* Native <label> tied to the input — the browser opens the file picker
            itself (no programmatic .click()), which is the most reliable across
            browsers. stopPropagation keeps the zone's onClick from firing it twice. */}
        <label
          htmlFor={inputId}
          role="button"
          tabIndex={0}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
          className="mt-sm inline-flex min-h-[48px] cursor-pointer items-center gap-xs rounded-lg border border-outline-variant/50 bg-surface-container-high px-md font-button text-button text-on-surface skeuo-raise skeuo-press hover:bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="folder_open" size={20} /> Browse Files
        </label>
        <p className="mt-md font-body text-label-caps text-label-caps text-on-surface-variant">{ACCEPT_HINT}</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      <p className="sr-only" role="status" aria-live="polite">{live}</p>

      {/* Staging panel — appears only once files have been added. */}
      {staged.length > 0 && (
        <div
          ref={stagePanelRef}
          className="skeuo-card mt-md space-y-md rounded-xl p-md"
          aria-label="Confirm document details before uploading"
        >
          <div>
            <h3 className="font-headline-md text-button font-bold text-on-surface">
              {staged.length === 1 ? "You've added 1 file" : `You've added ${staged.length} files`}
            </h3>
            <p className="mt-0.5 font-body text-body-md text-on-surface-variant">
              Tell us what {staged.length === 1 ? "it is" : "they are"} and we'll upload {staged.length === 1 ? "it" : "them"}.
            </p>
          </div>

          <ul className="space-y-xs">
            {staged.map(({ id, file }) => (
              <li
                key={id}
                className="flex items-center gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-sm py-2"
              >
                <Icon name={file.type === "application/pdf" ? "picture_as_pdf" : "image"} size={22} className="flex-none text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-body-md text-on-surface">{file.name}</span>
                  <span className="block font-body text-label font-normal text-on-surface-variant">{formatFileSize(file.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeStaged(id)}
                  aria-label={`Remove ${file.name}`}
                  className="grid h-10 w-10 flex-none place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-error focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon name="close" size={20} />
                </button>
              </li>
            ))}
          </ul>

          <DocumentTypeSelector value={documentType} onChange={onTypeChange} error={typeError} options={typeOptions} />

          {documentType === "bank-statement" && (
            <LenderSelector
              value={bankLender}
              onChange={(v) => { setBankLender(v); setLenderError(null); }}
              lenders={lenderNames}
              error={lenderError}
            />
          )}

          <div className="flex flex-wrap items-center gap-sm pt-1">
            <Button variant="primary" leadingIcon="upload" onClick={startUploads}>
              {staged.length === 1 ? "Upload document" : "Upload documents"}
            </Button>
            <Button variant="ghost" onClick={clearStaged}>Cancel</Button>
          </div>
        </div>
      )}

      <UploadProgress items={uploads} onCancel={cancel} onRetry={retry} />
    </div>
  );
});
