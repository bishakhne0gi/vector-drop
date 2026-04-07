export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        background: "var(--bg-primary)",
      }}
    >
      {children}
    </div>
  );
}
