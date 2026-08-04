import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createServiceClient,
  fetchClerkUsers,
  fetchFeedback,
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
  Stars,
  T,
  Table,
  Td,
  Th,
  UserCell,
  fmtDateTime,
} from "@/components/admin/ui";

const PER_PAGE = 50;

type Search = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const PAGES = ["dashboard", "editor", "landing"] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const rawRating = Number.parseInt(one(params.rating) ?? "", 10);
  const rating = rawRating >= 1 && rawRating <= 5 ? rawRating : undefined;
  const rawPage = one(params.page_name);
  const source = PAGES.includes(rawPage as (typeof PAGES)[number])
    ? rawPage
    : undefined;
  const rawDate = one(params.date);
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : undefined;
  const withMessage = one(params.msg) === "1";
  // "guest" is a real filter value here — feedback.user_id is nullable.
  const userFilter = one(params.user)?.trim() || undefined;
  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);

  const svc = createServiceClient();
  const [allFeedback, users] = await Promise.all([
    fetchFeedback(svc),
    fetchClerkUsers(),
  ]);

  // The join: Clerk owns the emails, Supabase owns the feedback rows.
  const userById = new Map(users.map((u) => [u.id, u]));

  const filtered = allFeedback.filter((f) => {
    if (rating && f.rating !== rating) return false;
    if (source && f.page !== source) return false;
    if (date && toDay(f.created_at) !== date) return false;
    if (withMessage && !f.message?.trim()) return false;
    if (userFilter === "guest" && f.user_id) return false;
    if (userFilter && userFilter !== "guest" && f.user_id !== userFilter) {
      return false;
    }
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const rated = filtered.filter((f) => typeof f.rating === "number");
  const average = rated.length
    ? (rated.reduce((sum, f) => sum + (f.rating as number), 0) / rated.length).toFixed(2)
    : "—";
  const withMessageCount = filtered.filter((f) => f.message?.trim()).length;
  const fromGuests = filtered.filter((f) => !f.user_id).length;
  const identified = filtered.filter(
    (f) => f.user_id && userById.has(f.user_id),
  ).length;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: filtered.filter((f) => f.rating === star).length,
  }));
  const maxBucket = Math.max(1, ...distribution.map((d) => d.count));

  const filterParams = {
    rating: rating ? String(rating) : undefined,
    page_name: source,
    date,
    msg: withMessage ? "1" : undefined,
    user: userFilter,
  };

  const filteredUser = userFilter && userFilter !== "guest"
    ? userById.get(userFilter)
    : undefined;

  return (
    <AdminShell adminEmail={admin.email} active="/hades/feedback">
      <PageTitle
        title="Feedback"
        subtitle="Every rating and comment, attributed to the account that left it"
      />

      {userFilter ? (
        <Card style={{ marginBottom: 24, borderColor: T.borderStrong }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <span>
              Showing feedback from{" "}
              <strong>
                {userFilter === "guest"
                  ? "guests only"
                  : (filteredUser?.email ?? `unknown account ${userFilter}`)}
              </strong>
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {userFilter !== "guest" ? (
                <Link
                  href={`/hades/users/${userFilter}`}
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11,
                    color: T.textSec,
                    textDecoration: "none",
                  }}
                >
                  open user →
                </Link>
              ) : null}
              <Link
                href="/hades/feedback"
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 11,
                  color: T.textSec,
                  textDecoration: "none",
                }}
              >
                show everyone →
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <StatGrid>
        <StatCard label="Responses" value={filtered.length} />
        <StatCard
          label="Average rating"
          value={average}
          tone={
            average === "—"
              ? undefined
              : Number(average) >= 4
                ? "ok"
                : Number(average) >= 3
                  ? "warn"
                  : "bad"
          }
        />
        <StatCard label="With a comment" value={withMessageCount} />
        <StatCard
          label="Identified users"
          value={identified}
          hint={`${fromGuests} from guests`}
        />
      </StatGrid>

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.textMut,
            marginBottom: 14,
          }}
        >
          Rating distribution
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {distribution.map(({ star, count }) => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 68, flexShrink: 0 }}>
                <Stars rating={star} />
              </span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(count / maxBucket) * 100}%`,
                    height: "100%",
                    background:
                      star >= 4 ? T.ok : star === 3 ? T.warn : T.bad,
                    opacity: count ? 0.75 : 0,
                  }}
                />
              </div>
              <span
                style={{
                  width: 36,
                  textAlign: "right",
                  fontFamily: T.fontMono,
                  fontSize: 12,
                  color: count ? T.text : T.textMut,
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <form
          method="GET"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}
        >
          {/* Keep the per-user view when other filters are applied on top. */}
          {userFilter ? <input type="hidden" name="user" value={userFilter} /> : null}
          <label style={labelStyle}>
            Rating
            <select name="rating" defaultValue={rating ? String(rating) : ""} style={inputStyle}>
              <option value="">any</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            From page
            <select name="page_name" defaultValue={source ?? ""} style={inputStyle}>
              <option value="">any</option>
              {PAGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Day
            <input type="date" name="date" defaultValue={date ?? ""} style={inputStyle} />
          </label>
          <label
            style={{
              ...labelStyle,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingBottom: 10,
            }}
          >
            <input
              type="checkbox"
              name="msg"
              value="1"
              defaultChecked={withMessage}
              style={{ accentColor: "#fff" }}
            />
            Has a comment
          </label>
          <button type="submit" style={buttonStyle}>
            Apply
          </button>
          {rating || source || date || withMessage ? (
            <Link
              href="/hades/feedback"
              style={{
                ...buttonStyle,
                background: "transparent",
                color: T.text,
                borderColor: T.borderStrong,
                textDecoration: "none",
              }}
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Rating</Th>
            <Th>User</Th>
            <Th>From</Th>
            <Th>Comment</Th>
            <Th>When</Th>
          </tr>
        </thead>
        <tbody>
          {slice.map((f) => (
            <tr key={f.id}>
              <Td>
                <Stars rating={f.rating} />
              </Td>
              <Td mono>
                <UserCell
                  userId={f.user_id}
                  email={f.user_id ? userById.get(f.user_id)?.email : null}
                />
              </Td>
              <Td mono>{f.page}</Td>
              <Td>
                {f.message?.trim() ? (
                  <span style={{ display: "block", maxWidth: 460 }}>{f.message}</span>
                ) : (
                  <span style={{ color: T.textMut }}>no comment</span>
                )}
              </Td>
              <Td mono>{fmtDateTime(f.created_at)}</Td>
            </tr>
          ))}
          {slice.length === 0 ? (
            <EmptyRow colSpan={5} label="No feedback matches this filter" />
          ) : null}
        </tbody>
      </Table>

      <Pager
        basePath="/hades/feedback"
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
