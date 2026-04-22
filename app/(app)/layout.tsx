import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <>
      {/* Force dark mode for all app pages — matches landing page aesthetic */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('dark');` }} />
      {children}
    </>
  );
}
