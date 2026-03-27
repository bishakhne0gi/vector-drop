import { redirect } from "next/navigation";
import { createRouteClient } from "@/lib/api/supabase";
import { FloatingThemeToggle } from "@/components/shared/FloatingThemeToggle";
import { LandingPage } from "@/components/shared/LandingPage";

export default async function RootPage() {
  const supabase = await createRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

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
