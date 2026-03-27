"use client";

import { useState, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(rest.value) || Boolean(rest.defaultValue);
  const floated = focused || hasValue;

  return (
    <div className="relative">
      <input
        {...rest}
        id={inputId}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        className={cn(
          "peer w-full rounded-xl border bg-[var(--bg-glass)] px-4 pb-2 pt-5",
          "text-sm text-[var(--text-primary)] placeholder-transparent",
          "backdrop-blur-md transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40",
          error
            ? "border-[var(--destructive)]/50"
            : "border-[var(--border-glass)] focus:border-[var(--accent)]/50",
          className,
        )}
        placeholder={label}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute left-4 transition-all duration-150",
          floated
            ? "top-1.5 text-[10px] font-medium text-[var(--accent)]"
            : "top-3.5 text-sm text-[var(--text-muted)]",
        )}
      >
        {label}
      </label>
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 text-xs text-[var(--destructive)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
