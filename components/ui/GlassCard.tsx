import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section" | "aside";
}

export function GlassCard({
  children,
  className,
  hover = false,
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag
      className={cn(
        "glass-card",
        hover &&
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
