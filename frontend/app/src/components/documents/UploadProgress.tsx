import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { formatFileSize, getFileIcon } from "@/lib/format";

export interface UploadItem {
  id: number;
  name: string;
  fileSize: number;
  mime: string;
  progress: number; // 0–100
  status: "uploading" | "done" | "error";
  error?: string;
}

/** The live upload queue beneath the drop zone — one row per file with a
 *  progress bar, cancel, and retry-on-failure. Purely presentational. */
export function UploadProgress({
  items, onCancel, onRetry,
}: { items: UploadItem[]; onCancel: (id: number) => void; onRetry: (id: number) => void }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-sm space-y-sm">
      <AnimatePresence initial={false}>
        {items.map((u) => (
          <motion.li
            key={u.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="skeuo-card flex flex-col gap-xs rounded-xl p-sm"
          >
            <div className="flex items-center gap-sm">
              <span className={cn(
                "grid h-12 w-12 flex-none place-items-center rounded-lg border",
                u.status === "error" ? "border-error/20 bg-error-container text-on-error-container" : "border-outline-variant/30 bg-surface-container-high text-secondary",
              )}>
                <Icon name={u.status === "error" ? "error" : getFileIcon(u.mime)} size={22} fill={u.status === "error"} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body-lg text-body-lg text-on-surface" title={u.name}>{u.name}</p>
                <p className="font-body text-label font-normal text-on-surface-variant">
                  {u.status === "uploading" && `Uploading… ${Math.round(u.progress)}%`}
                  {u.status === "done" && `${formatFileSize(u.fileSize)} · Uploaded successfully`}
                  {u.status === "error" && (u.error ?? "Upload failed")}
                </p>
              </div>
              {u.status === "uploading" && (
                <button
                  type="button"
                  onClick={() => onCancel(u.id)}
                  aria-label={`Cancel upload of ${u.name}`}
                  className="grid h-11 w-11 flex-none place-items-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Icon name="close" size={20} />
                </button>
              )}
              {u.status === "done" && <Icon name="check_circle" size={24} fill className="flex-none text-primary" />}
              {u.status === "error" && (
                <div className="flex flex-none items-center gap-xs">
                  <button
                    type="button"
                    onClick={() => onRetry(u.id)}
                    className="min-h-[44px] rounded-lg px-2 font-button text-button text-primary hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(u.id)}
                    aria-label={`Dismiss ${u.name}`}
                    className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Icon name="cancel" size={20} />
                  </button>
                </div>
              )}
            </div>
            {u.status === "uploading" && (
              <div className="mt-xs h-2 overflow-hidden rounded-full skeuo-recessed">
                <div className="progress-fill h-full rounded-full transition-[width] duration-200" style={{ width: `${u.progress}%` }} />
              </div>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
