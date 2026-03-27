"use client";

import { cn } from "@/lib/utils";
import type { AIProvider } from "@/lib/types";

interface ProviderToggleProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
}

const OPTIONS: { label: string; value: AIProvider }[] = [
  { label: "Claude", value: "claude" },
  { label: "Gemini", value: "gemini" },
];

export function ProviderToggle({ value, onChange }: ProviderToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="AI provider"
      className="flex items-center rounded-xl border border-border p-1"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              isActive
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
