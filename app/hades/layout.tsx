import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Never indexed, never followed, never cached by a proxy. The matching
 * `X-Robots-Tag` header is set in proxy.ts so even non-HTML responses under
 * /hades carry it. /hades is deliberately absent from robots.txt — listing it
 * there would publish the path to anyone who reads the file.
 */
export const metadata: Metadata = {
  title: "Hades",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function HadesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First gate. Every page re-checks — see requireAdmin's docblock.
  await requireAdmin();
  return <>{children}</>;
}
