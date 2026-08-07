import { requireAdmin } from "@/lib/admin/auth";
import {
  createServiceClient,
  fetchClerkUsers,
  fetchCredits,
  fetchLedger,
  fetchPurchases,
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
  UserCell,
  fmtCredits,
  fmtDateTime,
  fmtMoney,
} from "@/components/admin/ui";

const PER_PAGE = 50;

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Card has no title prop; this matches the mono/uppercase labelling used elsewhere. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: 24 }}>
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
        {title}
      </h2>
      {children}
    </Card>
  );
}

const REASON_LABEL: Record<string, string> = {
  signup_grant: "Signup grants",
  purchase: "Purchased",
  conversion: "Spent on conversions",
  version_export: "Spent on exports",
  refund: "Refunded",
  admin_adjust: "Admin adjustments",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);

  const svc = createServiceClient();
  const [purchases, credits, ledger, users] = await Promise.all([
    fetchPurchases(svc),
    fetchCredits(svc),
    fetchLedger(svc),
    fetchClerkUsers(),
  ]);

  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const succeeded = purchases.filter((p) => p.status === "succeeded");
  const failed = purchases.filter((p) => p.status === "failed");
  const refunded = purchases.filter((p) => p.status === "refunded");

  // Revenue is summed PER CURRENCY. Dodo bills in the customer's local
  // currency, so adding INR paise to USD cents would produce a meaningless
  // number — an easy and expensive mistake to make on a revenue dashboard.
  const revenueByCurrency = new Map<string, number>();
  for (const p of succeeded) {
    revenueByCurrency.set(
      p.currency,
      (revenueByCurrency.get(p.currency) ?? 0) + p.amount_cents,
    );
  }

  const payingUserIds = new Set(succeeded.map((p) => p.user_id));

  const outstandingUnits = credits.reduce((sum, c) => sum + c.balance_units, 0);
  const spentUnits = credits.reduce((sum, c) => sum + c.lifetime_spent, 0);

  const byReason = new Map<string, number>();
  for (const row of ledger) {
    byReason.set(row.reason, (byReason.get(row.reason) ?? 0) + row.delta_units);
  }

  const pageCount = Math.max(1, Math.ceil(purchases.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const slice = purchases.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const topBalances = credits.filter((c) => c.balance_units > 0).slice(0, 12);

  return (
    <AdminShell adminEmail={admin.email} active="/hades/payments">
      <PageTitle
        title="Payments"
        subtitle="Purchases, credit balances, and where credits are being spent."
      />

      <StatGrid>
        <StatCard
          label="Paying users"
          value={payingUserIds.size}
          hint={`${succeeded.length} successful payments`}
        />
        <StatCard
          label="Revenue"
          value={
            revenueByCurrency.size === 0
              ? "—"
              : [...revenueByCurrency.entries()]
                  .map(([cur, amt]) => fmtMoney(amt, cur))
                  .join("  ·  ")
          }
          hint="gross, per currency"
        />
        <StatCard
          label="Credits outstanding"
          value={fmtCredits(outstandingUnits)}
          hint="unspent balance across all users"
        />
        <StatCard
          label="Credits spent"
          value={fmtCredits(spentUnits)}
          hint={`${failed.length} failed · ${refunded.length} refunded`}
        />
      </StatGrid>

      <Section title="Where credits go">
        <Table>
          <thead>
            <tr>
              <Th>Reason</Th>
              <Th align="right">Credits</Th>
            </tr>
          </thead>
          <tbody>
            {byReason.size === 0 ? (
              <EmptyRow colSpan={2} label="No ledger activity yet" />
            ) : (
              [...byReason.entries()]
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .map(([reason, units]) => (
                  <tr key={reason}>
                    <Td>{REASON_LABEL[reason] ?? reason}</Td>
                    <Td align="right">
                      <span
                        style={{
                          fontFamily: T.fontMono,
                          color: units < 0 ? T.warn : T.ok,
                        }}
                      >
                        {units > 0 ? "+" : ""}
                        {fmtCredits(units)}
                      </span>
                    </Td>
                  </tr>
                ))
            )}
          </tbody>
        </Table>
      </Section>

      <Section title={`Purchases (${purchases.length})`}>
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Payment ID</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Credits</Th>
              <Th>Status</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <EmptyRow colSpan={6} label="No purchases yet" />
            ) : (
              slice.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <UserCell userId={p.user_id} email={emailById.get(p.user_id)} />
                  </Td>
                  <Td>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>
                      {p.dodo_payment_id}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: T.fontMono }}>
                      {fmtMoney(p.amount_cents, p.currency)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: T.fontMono, color: T.textSec }}>
                      {p.status === "succeeded" ? fmtCredits(p.credits_granted) : "—"}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>{fmtDateTime(p.created_at)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <Pager basePath="/hades/payments" page={safePage} pageCount={pageCount} />
      </Section>

      <Section title="Largest balances">
        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th align="right">Balance</Th>
              <Th align="right">Granted</Th>
              <Th align="right">Spent</Th>
              <Th>Last change</Th>
            </tr>
          </thead>
          <tbody>
            {topBalances.length === 0 ? (
              <EmptyRow colSpan={5} label="No credit balances yet" />
            ) : (
              topBalances.map((c) => (
                <tr key={c.user_id}>
                  <Td>
                    <UserCell userId={c.user_id} email={emailById.get(c.user_id)} />
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: T.fontMono }}>{fmtCredits(c.balance_units)}</span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: T.fontMono, color: T.textSec }}>
                      {fmtCredits(c.lifetime_granted)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontFamily: T.fontMono, color: T.textSec }}>
                      {fmtCredits(c.lifetime_spent)}
                    </span>
                  </Td>
                  <Td>{fmtDateTime(c.updated_at)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Section>
    </AdminShell>
  );
}
