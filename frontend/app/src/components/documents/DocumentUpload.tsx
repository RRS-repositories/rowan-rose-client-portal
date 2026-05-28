import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/useToast";
import { uploadDocument } from "@/api/documents";
import { validateFile } from "@/lib/format";
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME, ACCEPT_HINT, MAX_FILES_PER_UPLOAD } from "@/config/upload";
import type { DocumentType, RequirementKind, UploadedDoc } from "@/data/types";
import { UploadProgress, type UploadItem } from "./UploadProgress";

interface Props {
  documentType: DocumentType | "";
  /** Called when the user tries to add files with no type chosen. */
  onRequireType: () => void;
  /** Called once a file finishes uploading (optimistic list + requirement update). */
  onUploaded: (doc: UploadedDoc, requirementUpdated: RequirementKind | null) => void;
}

export interface DocumentUploadHandle { focusZone: () => void }

const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS, ...ACCEPTED_MIME].join(",");

type DragState = "none" | "valid" | "invalid";

/** Drag-and-drop zone + per-file progress. Validation runs before upload;
 *  progress is simulated client-side, then the mock API is called at 100%. */
export const DocumentUpload = forwardRef<DocumentUploadHandle, Props>(function DocumentUpload(
  { documentType, onRequireType, onUploaded },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const timers = useRef<Map<number, number>>(new Map());
  const progressRef = useRef<Map<number, number>>(new Map());
  const pending = useRef<Map<number, { file: File; type: DocumentType }>>(new Map());

  const [drag, setDrag] = useState<DragState>("none");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [live, setLive] = useState("");
  const { push } = useToast();

  useImperativeHandle(ref, () => ({ focusZone: () => zoneRef.current?.focus() }), []);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

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
      onUploaded(res.document, res.requirementUpdated);
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

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (!documentType) {
      push({ title: "Choose a document type", description: "Please tell us what type of document this is before uploading.", tone: "error" });
      onRequireType();
      return;
    }
    const arr = Array.from(fileList);
    if (arr.length > MAX_FILES_PER_UPLOAD) {
      push({ title: "Too many files", description: `You can upload a maximum of ${MAX_FILES_PER_UPLOAD} files at once. You selected ${arr.length} files.`, tone: "error" });
      return;
    }
    arr.forEach((file) => {
      const { valid, error } = validateFile(file);
      if (!valid) {
        push({ title: "We couldn't add that file", description: error ?? "That file isn't accepted.", tone: "error" });
        return;
      }
      const id = ++seq.current;
      pending.current.set(id, { file, type: documentType });
      setUploads((cur) => [...cur, { id, name: file.name, fileSize: file.size, mime: file.type, progress: 0, status: "uploading" }]);
      setLive(`Uploading ${file.name}.`);
      startSim(id);
    });
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
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openPicker(); }}
          className="mt-sm inline-flex min-h-[48px] items-center gap-xs rounded-lg border border-outline-variant/50 bg-surface-container-high px-md font-button text-button text-on-surface skeuo-raise skeuo-press hover:bg-surface-container-highest focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="folder_open" size={20} /> Browse Files
        </button>
        <p className="mt-md font-body text-label-caps text-label-caps text-on-surface-variant">{ACCEPT_HINT}</p>
        <input
          ref={inputRef}
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

      <UploadProgress items={uploads} onCancel={cancel} onRetry={retry} />
    </div>
  );
});
