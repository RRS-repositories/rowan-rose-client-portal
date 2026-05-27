import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Requirement } from "@/data/types";

export function RequirementRow({ requirement: r, onAction }: { requirement: Requirement; onAction: (r: Requirement) => void }) {
  return (
    <li className="skeuo-card flex items-center gap-sm rounded-xl p-sm">
      <span className="grid h-12 w-12 flex-none place-items-center rounded-lg border border-error/10 bg-error-container/40 text-error skeuo-inner-highlight">
        <Icon name={r.icon} size={24} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-button text-button text-on-surface">{r.title}</p>
        <p className="font-body text-label font-normal text-on-surface-variant">{r.description}</p>
      </div>
      <Button variant="secondary" size="md" leadingIcon={r.kind === "questionnaire" ? "edit_note" : "upload"} onClick={() => onAction(r)} className="flex-none">
        {r.kind === "questionnaire" ? "Start" : "Upload"}
      </Button>
    </li>
  );
}

export function UploadedDocRow({ name, meta, kind }: { name: string; meta: string; kind: "pdf" | "image" }) {
  return (
    <li className="skeuo-card flex items-center gap-sm rounded-xl p-sm">
      <span className="grid h-12 w-12 flex-none place-items-center rounded-lg border border-outline-variant/30 bg-surface-container-high text-secondary">
        <Icon name={kind === "pdf" ? "description" : "image"} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body-lg text-body-lg text-on-surface">{name}</p>
        <p className="font-body text-label font-normal text-on-surface-variant">{meta}</p>
      </div>
      <Icon name="check_circle" size={24} fill className="text-primary" />
    </li>
  );
}
