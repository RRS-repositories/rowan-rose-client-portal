import { forwardRef, useId, useImperativeHandle, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/useToast";

const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 20 * 1024 * 1024;

type Status = "uploading" | "done" | "error";
interface SessionUpload { id: number; name: string; sizeLabel: string; progress: number; status: Status; error?: string; kind: "pdf" | "image" }
export interface UploadZoneHandle { open: () => void }

const fmtSize = (b: number) => (b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Drag-drop upload — faithful to the Stitch recessed tray, with real validation + mocked progress. */
export const UploadZone = forwardRef<UploadZoneHandle>(function UploadZone(_props, ref) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const idSeq = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const { push } = useToast();
  useImperativeHandle(ref, () => ({ open: () => inputRef.current?.click() }), []);

  function simulate(id: number) {
    const tick = window.setInterval(() => {
      setUploads((cur) =>
        cur.map((u) => {
          if (u.id !== id || u.status !== "uploading") return u;
          const next = Math.min(100, u.progress + 13 + Math.random() * 12);
          if (next >= 100) {
            window.clearInterval(tick);
            window.setTimeout(() => setUploads((c) => c.map((x) => (x.id === id ? { ...x, status: "done", progress: 100 } : x))), 250);
            return { ...u, progress: 100 };
          }
          return { ...u, progress: next };
        }),
      );
    }, 220);
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const id = ++idSeq.current;
      const kind: "pdf" | "image" = file.type === "application/pdf" ? "pdf" : "image";
      const typeOk = ACCEPT.includes(file.type);
      const sizeOk = file.size <= MAX_BYTES;
      if (!typeOk || !sizeOk) {
        const error = !typeOk ? "That file type isn't supported. Please use a PDF, JPG or PNG." : "That file is too large. The maximum size is 20MB.";
        setUploads((c) => [...c, { id, name: file.name, sizeLabel: fmtSize(file.size), progress: 0, status: "error", error, kind }]);
        push({ title: "We couldn't add that file", description: error, tone: "error" });
        return;
      }
      setUploads((c) => [...c, { id, name: file.name, sizeLabel: fmtSize(file.size), progress: 0, status: "uploading", kind }]);
      simulate(id);
      window.setTimeout(() => push({ title: "Upload complete", description: `${file.name} has been received.`, tone: "success" }), 2200);
    });
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          "skeuo-tray flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-low p-lg text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
        )}
      >
        <span className="relative mb-sm grid h-20 w-20 place-items-center" aria-hidden>
          <Icon name="cloud_upload" size={64} className="absolute translate-y-1 text-primary-container opacity-30 blur-[2px]" />
          <Icon name="cloud_upload" size={64} fill className="relative text-primary drop-shadow-sm" />
        </span>
        <p className="font-body-lg text-body-lg text-on-surface">Drop a file here, or tap to browse or take a photo.</p>
        <div className="mt-sm flex flex-wrap justify-center gap-xs">
          {["PDF", "JPG", "PNG"].map((t) => (
            <span key={t} className="rounded-full border border-outline-variant/30 bg-surface px-sm py-xs font-label-caps text-label-caps text-on-surface-variant skeuo-raise">{t}</span>
          ))}
        </div>
        <span className="mt-md inline-flex min-h-[48px] w-full max-w-[220px] items-center justify-center rounded-full bg-primary px-gutter font-button text-button text-on-primary skeuo-raise skeuo-press">Select Files</span>
        <input ref={inputRef} id={inputId} type="file" accept={ACCEPT.join(",")} multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
      </label>

      <AnimatePresence initial={false}>
        {uploads.map((u) => (
          <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="skeuo-card mt-sm flex flex-col gap-xs rounded-xl p-sm">
            <div className="flex items-center gap-sm">
              <span className={cn("grid h-12 w-12 flex-none place-items-center rounded-lg border border-outline-variant/30", u.status === "error" ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-secondary")}>
                <Icon name={u.status === "error" ? "error" : u.kind === "pdf" ? "description" : "image"} size={22} fill={u.status === "error"} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-lg text-body-lg text-on-surface">{u.name}</p>
                <p className="font-body text-label font-normal text-on-surface-variant">
                  {u.status === "uploading" && `Uploading… ${Math.round(u.progress)}%`}
                  {u.status === "done" && `${u.sizeLabel} · Received`}
                  {u.status === "error" && u.error}
                </p>
              </div>
              {u.status === "done" && <Icon name="check_circle" size={24} fill className="text-primary" />}
            </div>
            {u.status === "uploading" && (
              <div className="mt-xs h-2 overflow-hidden rounded-full skeuo-recessed">
                <div className="progress-fill h-full rounded-full transition-[width] duration-200" style={{ width: `${u.progress}%` }} />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
