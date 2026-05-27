import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { interactive?: boolean }

/** Tactile skeuomorphic surface (gradient + rim + layered shadow). */
export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div className={cn("skeuo-card rounded-xl", interactive && "skeuo-card-interactive cursor-pointer", className)} {...rest}>
      {children}
    </div>
  );
}
