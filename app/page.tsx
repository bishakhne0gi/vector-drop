import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FloatingThemeToggle } from "@/components/shared/FloatingThemeToggle";
import { LandingPage } from "@/components/shared/LandingPage";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <div className="page-bg" aria-hidden="true">
        <div className="page-bg-blob" aria-hidden="true" />
      </div>
      <FloatingThemeToggle />
      <LandingPage />
    </>
  );
}
