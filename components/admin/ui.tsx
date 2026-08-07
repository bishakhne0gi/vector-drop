import Link from "next/link";
import { ADMIN_TIMEZONE } from "@/lib/admin/config";

/* ─── Tokens — the dark surface used by /login, kept self-contained so the
   admin portal never depends on the marketing theme toggle. ─────────────── */
export const T = {
  bg: "#161516",
  surface: "#0d0d0d",
  surface2: "#131313",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#ffffff",
  textSec: "rgba(255,255,255,0.50)",
  textMut: "rgba(255,255,255,0.28)",
  ok: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
  fontBody: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontMono: "auxMono, ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/* ─── Formatting ──────────────────────────────────────────────────────────── */

const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ADMIN_TIMEZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateTimeFmt.format(new Date(iso));
}

export function fmtDay(day: string): string {
  // day is already YYYY-MM-DD in the admin timezone; parse as UTC noon to avoid drift
  const d = new Date(`${day}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

/**
 * Formats a payment amount from its smallest unit.
 *
 * Dodo bills in the customer's local currency, so amounts arrive as paise for
 * INR and cents for USD. Rendering them without dividing would show a ₹350
 * purchase as 35078.
 */
export function fmtMoney(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/**
 * Renders credit units (tenths) as credits: 200 -> "20", 19 -> "1.9", -1 -> "-0.1".
 *
 * Sign is applied to the whole string: Math.trunc(-1 / 10) is -0 and String(-0)
 * is "0", which would hide the minus on sub-credit debits — exactly the values
 * the ledger is full of.
 */
export function fmtCredits(units: number): string {
  const sign = units < 0 ? "-" : "";
  const abs = Math.abs(units);
  const whole = Math.trunc(abs / 10);
  const rest = abs % 10;
  return rest === 0 ? `${sign}${whole}` : `${sign}${whole}.${rest}`;
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */

const NAV = [
  { href: "/hades", label: "Overview" },
  { href: "/hades/conversions", label: "Conversions" },
  { href: "/hades/payments", label: "Payments" },
  { href: "/hades/users", label: "Users" },
  { href: "/hades/feedback", label: "Feedback" },
] as const;

export function AdminShell({
  adminEmail,
  active,
  children,
}: {
  adminEmail: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: T.fontBody,
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${T.border}`,
          background: T.surface,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ⛧ Hades
          </span>
          <nav style={{ display: "flex", gap: 4, flex: 1 }}>
            {NAV.map((item) => {
              const isActive = item.href === active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "6px 12px",
                    borderRadius: 6,
                    color: isActive ? T.text : T.textSec,
                    background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <span
            style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMut }}
          >
            {adminEmail} · {ADMIN_TIMEZONE}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
        {children}
      </main>
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em" }}>
        {title}
      </h1>
      {subtitle ? (
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: T.textSec,
            fontFamily: T.fontMono,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const color = tone ? T[tone] : T.text;
  return (
    <Card>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.textMut,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 500,
          lineHeight: 1,
          color,
        }}
      >
        {value}
      </div>
      {hint ? (
        <div style={{ marginTop: 8, fontSize: 12, color: T.textSec }}>{hint}</div>
      ) : null}
    </Card>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
        marginBottom: 28,
      }}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "ready" ? T.ok : status === "error" ? T.bad : T.warn;
  return (
    <span
      style={{
        fontFamily: T.fontMono,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: tone,
        border: `1px solid ${tone}44`,
        background: `${tone}14`,
        borderRadius: 4,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

export function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ color: T.textMut }}>—</span>;
  const tone = rating >= 4 ? T.ok : rating === 3 ? T.warn : T.bad;
  return (
    <span style={{ whiteSpace: "nowrap" }} title={`${rating} out of 5`}>
      <span style={{ color: tone }}>{"★".repeat(rating)}</span>
      <span style={{ color: T.textMut }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/**
 * Attributes a row to a user. Feedback and projects both allow a null user_id
 * (guests), and both can carry an id Clerk no longer knows — render all three
 * cases the same way everywhere.
 */
export function UserCell({
  userId,
  email,
}: {
  userId: string | null;
  email?: string | null;
}) {
  if (!userId) return <span style={{ color: T.textMut }}>guest</span>;
  return (
    <Link
      href={`/hades/users/${userId}`}
      style={{
        color: email ? T.text : T.textSec,
        textDecoration: "none",
        borderBottom: `1px solid ${T.borderStrong}`,
      }}
      title={userId}
    >
      {email ?? "unknown account"}
    </Link>
  );
}

/* ─── Table ───────────────────────────────────────────────────────────────── */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        overflowX: "auto",
        background: T.surface,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          minWidth: 720,
        }}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "12px 14px",
        fontFamily: T.fontMono,
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: T.textMut,
        fontWeight: 400,
        borderBottom: `1px solid ${T.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  mono,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: "12px 14px",
        borderBottom: `1px solid ${T.border}`,
        color: T.text,
        fontFamily: mono ? T.fontMono : undefined,
        fontSize: mono ? 12 : 13,
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: "40px 14px",
          textAlign: "center",
          color: T.textMut,
          fontFamily: T.fontMono,
          fontSize: 12,
        }}
      >
        {label}
      </td>
    </tr>
  );
}

/* ─── Bar chart (pure CSS, no client JS) ──────────────────────────────────── */

export function BarChart({
  data,
}: {
  data: Array<{ day: string; value: number; secondary?: number }>;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        height: 160,
        paddingTop: 8,
      }}
    >
      {data.map((d) => {
        const h = Math.round((d.value / max) * 140);
        const errH = d.secondary
          ? Math.round((d.secondary / max) * 140)
          : 0;
        return (
          <div
            key={d.day}
            title={`${d.day} — ${d.value} conversions${
              d.secondary ? `, ${d.secondary} failed` : ""
            }`}
            style={{
              flex: 1,
              minWidth: 6,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              height: "100%",
            }}
          >
            {errH > 0 ? (
              <div
                style={{
                  height: errH,
                  background: `${T.bad}88`,
                  borderRadius: "3px 3px 0 0",
                }}
              />
            ) : null}
            <div
              style={{
                height: Math.max(h - errH, d.value > 0 ? 2 : 1),
                background:
                  d.value > 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.08)",
                borderRadius: errH > 0 ? 0 : "3px 3px 0 0",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ─── SVG / image preview ─────────────────────────────────────────────────── */

export function Thumb({
  url,
  alt,
  size = 44,
}: {
  url?: string;
  alt: string;
  size?: number;
}) {
  if (!url) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 6,
          border: `1px dashed ${T.borderStrong}`,
          display: "grid",
          placeItems: "center",
          color: T.textMut,
          fontFamily: T.fontMono,
          fontSize: 9,
        }}
      >
        n/a
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: 6,
        background: T.surface2,
        border: `1px solid ${T.border}`,
      }}
    />
  );
}

/* ─── Pagination ──────────────────────────────────────────────────────────── */

export function Pager({
  basePath,
  page,
  pageCount,
  extraParams,
}: {
  basePath: string;
  page: number;
  pageCount: number;
  extraParams?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const build = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(extraParams ?? {})) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: T.fontMono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "7px 14px",
    border: `1px solid ${T.borderStrong}`,
    borderRadius: 6,
    color: T.text,
    textDecoration: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
      }}
    >
      {page > 1 ? (
        <Link href={build(page - 1)} style={linkStyle}>
          ← Prev
        </Link>
      ) : (
        <span style={{ ...linkStyle, color: T.textMut, borderColor: T.border }}>
          ← Prev
        </span>
      )}
      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>
        {page} / {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={build(page + 1)} style={linkStyle}>
          Next →
        </Link>
      ) : (
        <span style={{ ...linkStyle, color: T.textMut, borderColor: T.border }}>
          Next →
        </span>
      )}
    </div>
  );
}
