import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  buildDailyStats,
  createServiceClient,
  fetchClerkUsers,
  fetchFeedback,
  fetchIcons,
  fetchProjects,
  recentDays,
  today,
  toDay,
} from "@/lib/admin/queries";
import {
  AdminShell,
  BarChart,
  Card,
  EmptyRow,
  PageTitle,
  StatCard,
  StatGrid,
  Stars,
  T,
  Table,
  Td,
  Th,
  UserCell,
  fmtDay,
  fmtRelative,
} from "@/components/admin/ui";

const CHART_DAYS = 30;
const TABLE_DAYS = 14;

export default async function HadesOverviewPage() {
  const admin = await requireAdmin();
  const svc = createServiceClient();

  const [projects, icons, feedback, users] = await Promise.all([
    fetchProjects(svc),
    fetchIcons(svc),
    fetchFeedback(svc),
    fetchClerkUsers(),
  ]);

  const days = recentDays(CHART_DAYS);
  const stats = buildDailyStats(projects, icons, days);
  const todayKey = today();
  const todayStats = stats[0];

  const totalReady = projects.filter((p) => p.status === "ready").length;
  const totalErrored = projects.filter((p) => p.status === "error").length;
  const guestConversions = projects.filter((p) => !p.user_id).length;
  const newUsersToday = users.filter(
    (u) => u.createdAt && toDay(u.createdAt) === todayKey,
  ).length;
  const successRate = projects.length
    ? Math.round((totalReady / projects.length) * 100)
    : 0;

  // Chart reads left→right oldest→newest; stats are newest-first.
  const chartData = [...stats]
    .reverse()
    .map((s) => ({ day: s.day, value: s.conversions, secondary: s.errored }));

  const recentProjects = projects.slice(0, 8);
  const recentFeedback = feedback.slice(0, 5);
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return (
    <AdminShell adminEmail={admin.email} active="/hades">
      <PageTitle
        title="Overview"
        subtitle={`Every conversion, user and icon on VectorDrop · today is ${todayKey}`}
      />

      <StatGrid>
        <StatCard
          label="Conversions today"
          value={todayStats?.conversions ?? 0}
          hint={`${todayStats?.ready ?? 0} ready · ${todayStats?.errored ?? 0} failed`}
        />
        <StatCard
          label="Active users today"
          value={todayStats?.signedInUsers ?? 0}
          hint={`${todayStats?.guestConversions ?? 0} guest conversions`}
        />
        <StatCard label="New signups today" value={newUsersToday} />
        <StatCard label="Total users" value={users.length} />
        <StatCard
          label="Total conversions"
          value={projects.length}
          hint={`${guestConversions} by guests`}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          tone={successRate >= 90 ? "ok" : successRate >= 70 ? "warn" : "bad"}
          hint={`${totalErrored} failed all-time`}
        />
        <StatCard label="Icons generated" value={icons.length} />
        <StatCard label="Feedback" value={feedback.length} />
      </StatGrid>

      <Card style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.textMut,
            }}
          >
            Conversions · last {CHART_DAYS} days
          </span>
          <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.fontMono }}>
            red = failed
          </span>
        </div>
        <BarChart data={chartData} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontFamily: T.fontMono,
            fontSize: 10,
            color: T.textMut,
          }}
        >
          <span>{chartData[0]?.day}</span>
          <span>{chartData[chartData.length - 1]?.day}</span>
        </div>
      </Card>

      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 12px" }}>
        Daily breakdown
      </h2>
      <Table>
        <thead>
          <tr>
            <Th>Day</Th>
            <Th align="right">Conversions</Th>
            <Th align="right">Ready</Th>
            <Th align="right">Failed</Th>
            <Th align="right">In flight</Th>
            <Th align="right">Icons</Th>
            <Th align="right">Signed-in users</Th>
            <Th align="right">Guest</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {stats.slice(0, TABLE_DAYS).map((s) => (
            <tr key={s.day}>
              <Td mono>
                {fmtDay(s.day)}
                {s.day === todayKey ? (
                  <span style={{ color: T.textMut }}> · today</span>
                ) : null}
              </Td>
              <Td align="right" mono>
                {s.conversions}
              </Td>
              <Td align="right" mono>
                <span style={{ color: s.ready ? T.ok : T.textMut }}>{s.ready}</span>
              </Td>
              <Td align="right" mono>
                <span style={{ color: s.errored ? T.bad : T.textMut }}>
                  {s.errored}
                </span>
              </Td>
              <Td align="right" mono>
                <span style={{ color: s.inFlight ? T.warn : T.textMut }}>
                  {s.inFlight}
                </span>
              </Td>
              <Td align="right" mono>
                {s.icons}
              </Td>
              <Td align="right" mono>
                {s.signedInUsers}
              </Td>
              <Td align="right" mono>
                {s.guestConversions}
              </Td>
              <Td align="right">
                <Link
                  href={`/hades/conversions?date=${s.day}`}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    color: T.textSec,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  view →
                </Link>
              </Td>
            </tr>
          ))}
          {stats.length === 0 ? <EmptyRow colSpan={9} label="No data" /> : null}
        </tbody>
      </Table>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 20,
          marginTop: 28,
        }}
      >
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 12px" }}>
            Latest conversions
          </h2>
          <Card style={{ padding: 0 }}>
            {recentProjects.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: T.textMut,
                  fontFamily: T.fontMono,
                  fontSize: 12,
                }}
              >
                Nothing yet
              </div>
            ) : (
              recentProjects.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    padding: "12px 18px",
                    borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      <UserCell
                        userId={p.user_id}
                        email={p.user_id ? emailById.get(p.user_id) : null}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      color: T.textSec,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmtRelative(p.created_at)}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              margin: "0 0 12px",
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
              Latest feedback
            </h2>
            <Link
              href="/hades/feedback"
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.textSec,
                textDecoration: "none",
              }}
            >
              all {feedback.length} →
            </Link>
          </div>
          <Card style={{ padding: 0 }}>
            {recentFeedback.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: T.textMut,
                  fontFamily: T.fontMono,
                  fontSize: 12,
                }}
              >
                Nothing yet
              </div>
            ) : (
              recentFeedback.map((f, i) => (
                <div
                  key={f.id}
                  style={{
                    padding: "12px 18px",
                    borderTop: i === 0 ? "none" : `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontFamily: T.fontMono,
                      fontSize: 11,
                      color: T.textMut,
                    }}
                  >
                    <span>
                      <Stars rating={f.rating} /> · {f.page}
                    </span>
                    <span>{fmtRelative(f.created_at)}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      fontFamily: T.fontMono,
                      fontSize: 11,
                    }}
                  >
                    <UserCell
                      userId={f.user_id}
                      email={f.user_id ? emailById.get(f.user_id) : null}
                    />
                  </div>
                  {f.message?.trim() ? (
                    <div style={{ marginTop: 6, fontSize: 13, color: T.textSec }}>
                      {f.message}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
