"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface URLInputProps {
  value: string;
  onChange: (url: string) => void;
  onAnalyse: () => void;
  isLoading: boolean;
  disabled: boolean;
  error: string | null;
}

function validateUrl(url: string): string | null {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "URL must start with http:// or https://";
  }
  return null;
}

export function URLInput({
  value,
  onChange,
  onAnalyse,
  isLoading,
  disabled,
  error,
}: URLInputProps) {
  const [blurError, setBlurError] = useState<string | null>(null);

  const displayError = error ?? blurError;

  function handleBlur() {
    if (value.trim()) {
      setBlurError(validateUrl(value.trim()));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBlurError(null);
    onChange(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !isLoading && !disabled && value.trim()) {
      onAnalyse();
    }
  }

  const isActionDisabled = isLoading || disabled || !value.trim();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          type="url"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="https://phosphoricons.com"
          disabled={disabled || isLoading}
          aria-label="Icon library URL"
          aria-describedby={displayError ? "url-input-error" : undefined}
          aria-invalid={displayError ? true : undefined}
          className={cn(
            "w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors",
            (disabled || isLoading) && "opacity-50 cursor-not-allowed",
            displayError && "border-destructive focus:ring-destructive/40",
          )}
        />
        <button
          type="button"
          onClick={onAnalyse}
          disabled={isActionDisabled}
          aria-label={isLoading ? "Analysing style…" : "Analyse style"}
          className={cn(
            "shrink-0 rounded-xl px-6 py-2.5 text-sm font-medium transition-opacity",
            isActionDisabled
              ? "bg-foreground/20 text-foreground/40 cursor-not-allowed"
              : "bg-foreground text-background hover:opacity-80",
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/20 border-t-background"
                aria-hidden="true"
              />
              Analysing…
            </span>
          ) : (
            "Analyse Style"
          )}
        </button>
      </div>

      {displayError && (
        <div
          id="url-input-error"
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {displayError}
        </div>
      )}
    </div>
  );
}
