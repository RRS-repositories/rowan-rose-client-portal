import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: string;
  trailingIcon?: string;
  fullWidth?: boolean;
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg font-button text-button select-none transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none skeuo-press";
const sizes: Record<Size, string> = { md: "min-h-[48px] px-md", lg: "min-h-[56px] px-md" };
const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary skeuo-raise skeuo-primary-glow focus-on-primary hover:opacity-95",
  secondary: "bg-surface-container-high text-on-surface border border-outline-variant/50 skeuo-raise hover:bg-surface-container-highest",
  ghost: "bg-transparent text-primary hover:bg-surface-container-high",
  destructive: "bg-error text-on-error skeuo-raise focus-on-primary hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "lg", loading = false, leadingIcon, trailingIcon, fullWidth, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {loading && <Icon name="progress_activity" size={20} className="animate-spin" />}
      {!loading && leadingIcon && <Icon name={leadingIcon} size={20} />}
      <span>{children}</span>
      {!loading && trailingIcon && <Icon name={trailingIcon} size={20} />}
    </button>
  );
});
