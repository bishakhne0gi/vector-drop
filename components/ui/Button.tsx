import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

const variantClasses: Record<Variant, string> = {
  primary: "btn-accent text-white font-semibold",
  secondary: cn(
    "glass font-medium transition-all duration-150",
    "text-[var(--text-primary)] hover:bg-[var(--bg-glass-strong)]",
  ),
  ghost: cn(
    "font-medium transition-all duration-150",
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass)]",
    "border border-transparent hover:border-[var(--border-glass)]",
  ),
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled ?? loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        sizeClasses[size],
        variantClasses[variant],
        (disabled ?? loading) && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      )}
      {children}
    </button>
  );
}
