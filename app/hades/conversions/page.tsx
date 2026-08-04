import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createServiceClient,
  fetchClerkUsers,
  fetchProjects,
  signPaths,
  toDay,
} from "@/lib/admin/queries";
import {
  AdminShell,
  Card,
  EmptyRow,
  PageTitle,
  Pager,
  StatCard,
  StatGrid,
  StatusBadge,
  T,
  Table,
  Td,
  Th,
  Thumb,
  UserCell,
  fmtDateTime,
} from "@/components/admin/ui";

const PER_PAGE = 50;

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["ready", "error", "pending", "converting"] as const;

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const rawDate = one(params.date);
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : undefined;
  const rawStatus = one(params.status);
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? rawStatus
    : undefined;
  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);

  const svc = createServiceClient();
  const [allProjects, users] = await Promise.all([
    fetchProjects(svc),
    fetchClerkUsers(),
  ]);

  const filtered = allProjects.filter((p) => {
    if (date && toDay(p.created_at) !== date) return false;
    if (status && p.status !== status) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // Only sign what is on screen — signed URLs are credentials.
  const signed = await signPaths(svc, [
    ...slice.map((p) => p.svg_path),
    ...slice.map((p) => p.source_image_path),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));

  const readyCount = filtered.filter((p) => p.status === "ready").length;
  const errorCount = filtered.filter((p) => p.status === "error").length;
  const guestCount = filtered.filter((p) => !p.user_id).length;

  const filterParams = { date, status };

  return (
    <AdminShell adminEmail={admin.email} active="/hades/conversions">
      <PageTitle
        title="Conversions"
        subtitle={
          date
            ? `Uploads and generated SVGs on ${date}`
            : "Every upload and the SVG it produced, newest first"
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <form
          method="GET"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <label style={labelStyle}>
            Day
            <input
              type="date"
              name="date"
              defaultValue={date ?? ""}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Status
            <select name="status" defaultValue={status ?? ""} style={inputStyle}>
              <option value="">all</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" style={buttonStyle}>
            Apply
          </button>
          {date || status ? (
            <Link href="/hades/conversions" style={{ ...buttonStyle, background: "transparent", color: T.text, borderColor: T.borderStrong, textDecoration: "none" }}>
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      <StatGrid>
        <StatCard label="Matching" value={filtered.length} />
        <StatCard label="Ready" value={readyCount} tone="ok" />
        <StatCard label="Failed" value={errorCount} tone={errorCount ? "bad" : undefined} />
        <StatCard label="From guests" value={guestCount} />
      </StatGrid>

      <Table>
        <thead>
          <tr>
            <Th>Source</Th>
            <Th>Output</Th>
            <Th>Name</Th>
            <Th>User</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Notes</Th>
          </tr>
        </thead>
        <tbody>
          {slice.map((p) => {
            const user = p.user_id ? userById.get(p.user_id) : undefined;
            return (
              <tr key={p.id}>
                <Td>
                  <Thumb
                    url={p.source_image_path ? signed.get(p.source_image_path) : undefined}
                    alt={`source for ${p.name}`}
                  />
                </Td>
                <Td>
                  {p.svg_path && signed.get(p.svg_path) ? (
                    <a
                      href={signed.get(p.svg_path)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <Thumb url={signed.get(p.svg_path)} alt={`svg for ${p.name}`} />
                    </a>
                  ) : (
                    <Thumb alt="no svg" />
                  )}
                </Td>
                <Td>
                  <span style={{ display: "block", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                </Td>
                <Td mono>
                  <UserCell userId={p.user_id} email={user?.email} />
                </Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td mono>{fmtDateTime(p.created_at)}</Td>
                <Td>
                  <span style={{ color: T.bad, fontSize: 12 }}>
                    {p.error_message ?? ""}
                  </span>
                </Td>
              </tr>
            );
          })}
          {slice.length === 0 ? (
            <EmptyRow colSpan={7} label="No conversions match this filter" />
          ) : null}
        </tbody>
      </Table>

      <Pager
        basePath="/hades/conversions"
        page={safePage}
        pageCount={pageCount}
        extraParams={filterParams}
      />
    </AdminShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: T.fontMono,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: T.textMut,
};

const inputStyle: React.CSSProperties = {
  background: T.surface2,
  border: `1px solid ${T.borderStrong}`,
  borderRadius: 6,
  color: T.text,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: T.fontBody,
  colorScheme: "dark",
};

const buttonStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#000000",
  border: "1px solid #ffffff",
  borderRadius: 6,
  padding: "8px 18px",
  fontFamily: T.fontMono,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};
