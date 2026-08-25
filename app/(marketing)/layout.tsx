import type { ReactNode } from "react";
import { AdSense } from "@/components/shared/AdSense";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AdSense />
    </>
  );
}
