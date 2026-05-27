import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg", className)} aria-hidden="true" />;
}

export function SkeletonClaimCard() {
  return (
    <div className="skeuo-card rounded-[20px] p-md" aria-hidden="true">
      <div className="flex items-center gap-sm">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-12 w-full rounded-xl" />
    </div>
  );
}
