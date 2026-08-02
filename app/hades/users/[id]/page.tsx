import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createServiceClient,
  fetchClerkUser,
  fetchFeedbackForUser,
  fetchIconsForUser,
  fetchProjectsForUser,
  signPaths,
  toDay,
  type AdminProjectRow,
} from "@/lib/admin/queries";
import {
  AdminShell,
  Card,
  EmptyRow,
  PageTitle,
  StatCard,
  StatGrid,
  StatusBadge,
  T,
  Table,
  Td,
  Th,
  Thumb,
  fmtDateTime,
  fmtDay,
  fmtRelative,
} from "@/components/admin/ui";

/** Newest first, grouped into calendar days. */
function groupByDay(projects: AdminProjectRow[]): Array<[string, AdminProjectRow[]]> {
  const map = new Map<string, AdminProjectRow[]>();
  for (const p of projects) {
    const day = toDay(p.created_at);
    const bucket = map.get(day);
    if (bucket) bucket.push(p);
    else map.set(day, [p]);
  }
  return [...map.entries()];
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const svc = createServiceClient();
  const [user, projects, icons, feedback] = await Promise.all([
    fetchClerkUser(id),
    fetchProjectsForUser(svc, id),
    fetchIconsForUser(svc, id),
    fetchFeedbackForUser(svc, id),
  ]);

  // Unknown to Clerk AND no rows anywhere — the id is made up.
  if (!user && projects.length === 0 && icons.length === 0 && feedback.length === 0) {
    notFound();
  }

  const signed = await signPaths(svc, [
    ...projects.map((p) => p.svg_path),
    ...projects.map((p) => p.source_image_path),
  ]);

  const ready = projects.filter((p) => p.status === "ready").length;
  const errored = projects.filter((p) => p.status === "error").length;
  const byDay = groupByDay(projects);
  const lastActivity = projects[0]?.created_at ?? icons[0]?.created_at ?? null;

  return (
    <AdminShell adminEmail={admin.email} active="/hades/users">
      <Link
        href="/hades/users"
        style={{
          fontFamily: T.fontMono,
          fontSize: 11,
          color: T.textSec,
          textDecoration: "none",
        }}
      >
        ← All users
      </Link>

      <div style={{ marginTop: 12 }}>
        <PageTitle
          title={user?.email ?? "Deleted / unknown user"}
          subtitle={`${user?.name ? `${user.name} · ` : ""}${id}`}
        />
      </div>

      {!user ? (
        <Card style={{ marginBottom: 24, borderColor: `${T.warn}55` }}>
          <span style={{ color: T.warn, fontSize: 13 }}>
            No Clerk account matches this id — the account was deleted, or these
            rows still carry a legacy id that was never remapped. The data below
            is still attributed to it.
          </span>
        </Card>
      ) : null}

      <StatGrid>
        <StatCard label="Conversions" value={projects.length} />
        <StatCard label="Ready" value={ready} tone="ok" />
        <StatCard label="Failed" value={errored} tone={errored ? "bad" : undefined} />
        <StatCard label="Icons" value={icons.length} />
        <StatCard label="Feedback" value={feedback.length} />
        <StatCard label="Joined" value={user ? fmtDateTime(user.createdAt) : "—"} />
        <StatCard
          label="Last sign in"
          value={user ? fmtRelative(user.lastSignInAt) : "—"}
        />
        <StatCard label="Last activity" value={fmtRelative(lastActivity)} />
      </StatGrid>

      {user ? (
        <Card style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.textSec,
            }}
          >
            <span>2FA: {user.twoFactorEnabled ? "on" : "off"}</span>
            <span>Banned: {user.banned ? "yes" : "no"}</span>
            <span>Locked: {user.locked ? "yes" : "no"}</span>
          </div>
        </Card>
      ) : null}

      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 12px" }}>
        Conversions by day
      </h2>

      {byDay.length === 0 ? (
        <Card>
          <span style={{ color: T.textMut, fontFamily: T.fontMono, fontSize: 12 }}>
            This user has never converted anything.
          </span>
        </Card>
      ) : (
        byDay.map(([day, items]) => (
          <div key={day} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.textSec,
              }}
            >
              <span>{fmtDay(day)}</span>
              <span style={{ color: T.textMut }}>
                {items.length} conversion{items.length === 1 ? "" : "s"}
              </span>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Output</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Time</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Thumb
                        url={
                          p.source_image_path
                            ? signed.get(p.source_image_path)
                            : undefined
                        }
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
                    <Td>{p.name}</Td>
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
                ))}
              </tbody>
            </Table>
          </div>
        ))
      )}

      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "28px 0 12px" }}>
        Generated icons
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>Prompt</Th>
            <Th>Style</Th>
            <Th align="right">Downloads</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {icons.map((i) => (
            <tr key={i.id}>
              <Td>{i.prompt || <span style={{ color: T.textMut }}>—</span>}</Td>
              <Td mono>{i.style}</Td>
              <Td align="right" mono>
                {i.download_count}
              </Td>
              <Td mono>{fmtDateTime(i.created_at)}</Td>
            </tr>
          ))}
          {icons.length === 0 ? <EmptyRow colSpan={4} label="No icons" /> : null}
        </tbody>
      </Table>

      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "28px 0 12px" }}>
        Feedback
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>Rating</Th>
            <Th>Page</Th>
            <Th>Message</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {feedback.map((f) => (
            <tr key={f.id}>
              <Td mono>{f.rating ? "★".repeat(f.rating) : "—"}</Td>
              <Td mono>{f.page}</Td>
              <Td>{f.message ?? <span style={{ color: T.textMut }}>—</span>}</Td>
              <Td mono>{fmtDateTime(f.created_at)}</Td>
            </tr>
          ))}
          {feedback.length === 0 ? <EmptyRow colSpan={4} label="No feedback" /> : null}
        </tbody>
      </Table>
    </AdminShell>
  );
}
