import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Spinner({
  className,
  label = "Cargando",
  size = "md",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <Loader2
        className={cn(
          "animate-spin text-brand",
          size === "sm" ? "size-4" : "size-5"
        )}
        aria-hidden
      />
    </span>
  );
}
