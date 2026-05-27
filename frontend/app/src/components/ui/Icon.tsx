import { cn } from "@/lib/cn";

interface IconProps { name: string; fill?: boolean; size?: number; className?: string }

/** Material Symbols Outlined glyph. Decorative — always pair with text. */
export function Icon({ name, fill, size, className }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined", fill && "fill", className)}
      style={size ? { fontSize: `${size}px` } : undefined}
    >
      {name}
    </span>
  );
}
