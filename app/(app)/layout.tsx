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
      {/*
        Dark mode for app pages is applied by the pre-paint script in
        app/layout.tsx and re-asserted by ThemeProvider on navigation.

        A <script> used to live here, but React never executes script tags
        rendered inside the component tree on the client — it only warned about
        it in the console — so on client-side navigation the class was never
        added, and ThemeProvider then removed it for anyone whose preference was
        light. That is what turned panels white.
      */}
      {children}
    </>
  );
}
