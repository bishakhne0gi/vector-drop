import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  buildUserActivity,
  createServiceClient,
  fetchClerkUsers,
  fetchFeedback,
  fetchIcons,
  fetchProjects,
  toDay,
  today,
  type AdminUser,
  type UserActivity,
} from "@/lib/admin/queries";
import {
  AdminShell,
  Card,
  EmptyRow,
  PageTitle,
  Pager,
  StatCard,
  StatGrid,
  T,
  Table,
  Td,
  Th,
  fmtDateTime,
  fmtRelative,
} from "@/components/admin/ui";

const PER_PAGE = 50;

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

type Sort = "recent" | "conversions" | "joined";
const SORTS: Sort[] = ["recent", "conversions", "joined"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const q = (one(params.q) ?? "").trim().toLowerCase();
  const rawSort = one(params.sort) as Sort | undefined;
  const sort: Sort = rawSort && SORTS.includes(rawSort) ? rawSort : "recent";
  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);

  const svc = createServiceClient();
  const [users, projects, icons, feedback] = await Promise.all([
    fetchClerkUsers(),
    fetchProjects(svc),
    fetchIcons(svc),
    fetchFeedback(svc),
  ]);

  const activity = buildUserActivity(projects, icons, feedback);
  const empty: UserActivity = {
    projects: 0,
    ready: 0,
    errored: 0,
    icons: 0,
    feedback: 0,
    firstActivity: null,
    lastActivity: null,
  };

  // Rows that reference a user_id Clerk no longer knows about (deleted account
  // or an un-remapped legacy id) still deserve a row — data would vanish silently.
  const known = new Set(users.map((u) => u.id));
  const orphans: AdminUser[] = [...activity.keys()]
    .filter((id) => !known.has(id))
    .map((id) => ({
      id,
      email: null,
      name: null,
      imageUrl: null,
      createdAt: null,
      lastSignInAt: null,
      banned: false,
      locked: false,
      twoFactorEnabled: false,
    }));

  let rows = [...users, ...orphans].map((u) => ({
    user: u,
    act: activity.get(u.id) ?? empty,
  }));

  if (q) {
    rows = rows.filter(
      ({ user }) =>
        user.email?.toLowerCase().includes(q) ||
        user.name?.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => {
    if (sort === "conversions") return b.act.projects - a.act.projects;
    if (sort === "joined")
      return (b.user.createdAt ?? "").localeCompare(a.user.createdAt ?? "");
    const aLast = a.act.lastActivity ?? a.user.lastSignInAt ?? "";
    const bLast = b.act.lastActivity ?? b.user.lastSignInAt ?? "";
    return bLast.localeCompare(aLast);
  });

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const slice = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const todayKey = today();
  const activeToday = new Set(
    projects
      .filter((p) => p.user_id && toDay(p.created_at) === todayKey)
      .map((p) => p.user_id as string),
  ).size;
  const withConversions = rows.filter((r) => r.act.projects > 0).length;
  const newThisWeek = users.filter(
    (u) =>
      u.createdAt &&
      Date.now() - new Date(u.createdAt).getTime() < 7 * 86_400_000,
  ).length;

  return (
    <AdminShell adminEmail={admin.email} active="/hades/users">
      <PageTitle
        title="Users"
        subtitle="Clerk directory joined with everything each account has produced"
      />

      <StatGrid>
        <StatCard label="Total users" value={users.length} />
        <StatCard label="New this week" value={newThisWeek} />
        <StatCard label="Active today" value={activeToday} />
        <StatCard
          label="Ever converted"
          value={withConversions}
          hint={`${users.length - withConversions} never did`}
        />
      </StatGrid>

      <Card style={{ marginBottom: 24 }}>
        <form
          method="GET"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
        >
          <label style={{ ...labelStyle, flex: 1, minWidth: 220 }}>
            Search
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="email, name or clerk id"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Sort
            <select name="sort" defaultValue={sort} style={inputStyle}>
              <option value="recent">Most recent activity</option>
              <option value="conversions">Most conversions</option>
              <option value="joined">Newest signup</option>
            </select>
          </label>
          <button type="submit" style={buttonStyle}>
            Apply
          </button>
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th align="right">Conversions</Th>
            <Th align="right">Ready</Th>
            <Th align="right">Failed</Th>
            <Th align="right">Icons</Th>
            <Th>Joined</Th>
            <Th>Last activity</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {slice.map(({ user, act }) => (
            <tr key={user.id}>
              <Td>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 13 }}>
                    {user.email ?? (
                      <span style={{ color: T.textMut }}>deleted / unknown</span>
                    )}
                    {user.banned ? (
                      <span style={{ color: T.bad, fontSize: 11 }}> · banned</span>
                    ) : null}
                    {user.locked ? (
                      <span style={{ color: T.warn, fontSize: 11 }}> · locked</span>
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 10,
                      color: T.textMut,
                    }}
                  >
                    {user.name ? `${user.name} · ` : ""}
                    {user.id}
                  </span>
                </div>
              </Td>
              <Td align="right" mono>
                {act.projects}
              </Td>
              <Td align="right" mono>
                <span style={{ color: act.ready ? T.ok : T.textMut }}>
                  {act.ready}
                </span>
              </Td>
              <Td align="right" mono>
                <span style={{ color: act.errored ? T.bad : T.textMut }}>
                  {act.errored}
                </span>
              </Td>
              <Td align="right" mono>
                {act.icons}
              </Td>
              <Td mono>{fmtDateTime(user.createdAt)}</Td>
              <Td mono>
                {fmtRelative(act.lastActivity ?? user.lastSignInAt)}
              </Td>
              <Td align="right">
                <Link
                  href={`/hades/users/${user.id}`}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    color: T.textSec,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  open →
                </Link>
              </Td>
            </tr>
          ))}
          {slice.length === 0 ? (
            <EmptyRow colSpan={8} label="No users match this search" />
          ) : null}
        </tbody>
      </Table>

      <Pager
        basePath="/hades/users"
        page={safePage}
        pageCount={pageCount}
        extraParams={{ q: q || undefined, sort: sort === "recent" ? undefined : sort }}
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
