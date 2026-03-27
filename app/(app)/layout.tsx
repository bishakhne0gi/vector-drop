import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav className="border-b border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-1 px-8 py-3">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            Dashboard
          </Link>
          <Link
            href="/icons"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            Icon Library
          </Link>
          <Link
            href="/v2"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
          >
            v2 · Style Transfer
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
