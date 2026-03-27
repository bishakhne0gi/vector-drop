import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * VectorDrop logo — a bezier path with visible anchor points,
 * representing the core product: raster → vector.
 */
export function LogoMark({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Background square — rounded */}
      <rect width="28" height="28" rx="7" fill="var(--accent)" />

      {/* Bezier curve — S-curve representing vector path */}
      <path
        d="M6 20 C6 20 10 7 14 14 C18 21 22 8 22 8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Anchor points */}
      <circle cx="6" cy="20" r="2" fill="white" />
      <circle cx="14" cy="14" r="1.5" fill="white" opacity="0.6" />
      <circle cx="22" cy="8" r="2" fill="white" />
    </svg>
  );
}

interface LogoFullProps {
  size?: number;
  className?: string;
  textClassName?: string;
}

export function Logo({ size = 28, className, textClassName }: LogoFullProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          "text-sm font-semibold tracking-tight text-[var(--text-primary)]",
          textClassName,
        )}
      >
        VectorDrop
      </span>
    </span>
  );
}
