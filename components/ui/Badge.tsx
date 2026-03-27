import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "accent";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--bg-glass)] text-[var(--text-secondary)] border border-[var(--border-glass)]",
  success:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  error:
    "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  info:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  accent:
    "bg-[var(--accent-glow)] text-[var(--accent)] border border-[var(--accent)]/20",
};

export function Badge({
  children,
  variant = "default",
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              variant === "warning" ? "bg-amber-500" : "bg-emerald-500",
            )}
            style={{ animation: "pulse-ring 1.2s ease-out infinite" }}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              variant === "warning" ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
