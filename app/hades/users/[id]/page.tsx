import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createServiceClient,
  fetchClerkUser,
  fetchCreditsForUser,
  fetchFeedbackForUser,
  fetchIconsForUser,
  fetchLedgerForUser,
  fetchProjectsForUser,
  fetchPurchasesForUser,
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
  Stars,
  StatusBadge,
  T,
  Table,
  Td,
  Th,
  Thumb,
  fmtCredits,
  fmtDateTime,
  fmtDay,
  fmtMoney,
  fmtRelative,
} from "@/components/admin/ui";

const LEDGER_LABEL: Record<string, string> = {
  signup_grant: "Signup grant",
  purchase: "Purchase",
  conversion: "Conversion",
  version_export: "Version export",
  refund: "Refund",
  admin_adjust: "Admin adjustment",
};

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
  const [user, projects, icons, feedback, creditRow, purchases, ledger] =
    await Promise.all([
      fetchClerkUser(id),
      fetchProjectsForUser(svc, id),
      fetchIconsForUser(svc, id),
      fetchFeedbackForUser(svc, id),
      fetchCreditsForUser(svc, id),
      fetchPurchasesForUser(svc, id),
      fetchLedgerForUser(svc, id),
    ]);

  // Unknown to Clerk AND no rows anywhere — the id is made up.
  if (!user && projects.length === 0 && icons.length === 0 && feedback.length === 0) {
    notFound();
  }

  const signed = await signPaths([
    ...projects.map((p) => p.svg_path),
    ...projects.map((p) => p.source_image_path),
  ]);

  const ready = projects.filter((p) => p.status === "ready").length;
  const errored = projects.filter((p) => p.status === "error").length;
  const byDay = groupByDay(projects);
  const lastActivity = projects[0]?.created_at ?? icons[0]?.created_at ?? null;

  const succeededPurchases = purchases.filter((p) => p.status === "succeeded");
  // Per currency — Dodo bills locally, so summing INR paise with USD cents
  // would produce a number that means nothing.
  const paidByCurrency = new Map<string, number>();
  for (const p of succeededPurchases) {
    paidByCurrency.set(p.currency, (paidByCurrency.get(p.currency) ?? 0) + p.amount_cents);
  }

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
        <StatCard
          label="Credits"
          value={creditRow ? fmtCredits(creditRow.balance_units) : "—"}
          tone={
            creditRow && creditRow.balance_units < 15
              ? "bad"
              : creditRow
                ? "ok"
                : undefined
          }
          hint={
            creditRow
              ? `${fmtCredits(creditRow.lifetime_granted)} granted · ${fmtCredits(creditRow.lifetime_spent)} spent`
              : "no credit row yet"
          }
        />
        <StatCard
          label="Paid"
          value={
            paidByCurrency.size === 0
              ? "—"
              : [...paidByCurrency.entries()]
                  .map(([cur, amt]) => fmtMoney(amt, cur))
                  .join(" · ")
          }
          hint={`${succeededPurchases.length} purchase${succeededPurchases.length === 1 ? "" : "s"}`}
          tone={succeededPurchases.length > 0 ? "ok" : undefined}
        />
      </StatGrid>

      <Card style={{ marginTop: 24, marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: T.textSec,
            margin: "0 0 14px",
            fontWeight: 500,
          }}
        >
          Payments &amp; credit history
        </h2>

        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Event</Th>
              <Th align="right">Credits</Th>
              <Th align="right">Balance after</Th>
              <Th>Reference</Th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <EmptyRow colSpan={5} label="No credit activity" />
            ) : (
              ledger.map((row) => {
                // Match a purchase row so the admin can see what was actually
                // charged, not just how many credits landed.
                const paymentId = row.idempotency_key.startsWith("dodo:")
                  ? row.idempotency_key.slice(5)
                  : null;
                const purchase = paymentId
                  ? purchases.find((p) => p.dodo_payment_id === paymentId)
                  : undefined;

                return (
                  <tr key={row.id}>
                    <Td>{fmtDateTime(row.created_at)}</Td>
                    <Td>{LEDGER_LABEL[row.reason] ?? row.reason}</Td>
                    <Td align="right">
                      <span
                        style={{
                          fontFamily: T.fontMono,
                          color: row.delta_units < 0 ? T.warn : T.ok,
                        }}
                      >
                        {row.delta_units > 0 ? "+" : ""}
                        {fmtCredits(row.delta_units)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span style={{ fontFamily: T.fontMono, color: T.textSec }}>
                        {fmtCredits(row.balance_after)}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMut }}>
                        {purchase
                          ? `${fmtMoney(purchase.amount_cents, purchase.currency)} · ${paymentId}`
                          : row.idempotency_key}
                      </span>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </Card>

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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          margin: "28px 0 12px",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Feedback</h2>
        {feedback.length > 0 ? (
          <Link
            href={`/hades/feedback?user=${encodeURIComponent(id)}`}
            style={{
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.textSec,
              textDecoration: "none",
            }}
          >
            in feedback view →
          </Link>
        ) : null}
      </div>
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
              <Td>
                <Stars rating={f.rating} />
              </Td>
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
