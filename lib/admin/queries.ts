import { clerkClient } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/api/supabase";
import { objectExists, signedDownloadUrl } from "@/lib/storage/r2";
import { ADMIN_TIMEZONE } from "./config";

type Svc = ReturnType<typeof createServiceClient>;

/** PostgREST caps a single response at 1000 rows; we page through in chunks. */
const CHUNK = 1000;
/** Hard ceiling so a runaway table can never blow up the admin request. */
const MAX_ROWS = 50_000;

// ─── Row shapes ──────────────────────────────────────────────────────────────

export interface AdminProjectRow {
  id: string;
  user_id: string | null;
  name: string;
  status: string;
  source_image_path: string | null;
  svg_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminIconRow {
  id: string;
  user_id: string;
  prompt: string;
  style: string;
  download_count: number;
  created_at: string;
}

export interface AdminFeedbackRow {
  id: string;
  user_id: string | null;
  page: string;
  rating: number | null;
  message: string | null;
  created_at: string;
}

export interface AdminPurchaseRow {
  id: string;
  user_id: string;
  dodo_payment_id: string;
  /** In the currency's smallest unit — paise for INR, cents for USD. */
  amount_cents: number;
  currency: string;
  /** Units granted, not credits: 200 units = 20 credits. */
  credits_granted: number;
  status: string;
  created_at: string;
}

export interface AdminCreditRow {
  user_id: string;
  balance_units: number;
  lifetime_granted: number;
  lifetime_spent: number;
  updated_at: string;
}

export interface AdminLedgerRow {
  id: string;
  user_id: string;
  delta_units: number;
  reason: string;
  balance_after: number;
  idempotency_key: string;
  created_at: string;
}

// ─── Paging helper ───────────────────────────────────────────────────────────

interface PostgrestPage<T> {
  data: T[] | null;
  error: { message: string } | null;
}

async function pageThrough<T>(
  query: (from: number, to: number) => PromiseLike<PostgrestPage<T>>,
  cap: number = MAX_ROWS,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < cap; from += CHUNK) {
    const to = Math.min(from + CHUNK, cap) - 1;
    const { data, error } = await query(from, to);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < to - from + 1) break;
  }
  return out;
}

// ─── Day bucketing ───────────────────────────────────────────────────────────

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ADMIN_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** ISO timestamp → "YYYY-MM-DD" in the admin timezone. */
export function toDay(iso: string): string {
  return dayFormatter.format(new Date(iso));
}

export function today(): string {
  return dayFormatter.format(new Date());
}

/** Descending list of the last `n` calendar days, today first. */
export function recentDays(n: number): string[] {
  const days: string[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i += 1) {
    days.push(dayFormatter.format(new Date(now - i * 86_400_000)));
  }
  return days;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

const PROJECT_COLUMNS =
  "id,user_id,name,status,source_image_path,svg_path,error_message,created_at,updated_at";

const PURCHASE_COLUMNS =
  "id,user_id,dodo_payment_id,amount_cents,currency,credits_granted,status,created_at";

export async function fetchProjects(svc: Svc): Promise<AdminProjectRow[]> {
  return pageThrough<AdminProjectRow>((from, to) =>
    svc
      .from("projects")
      .select(PROJECT_COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchProjectsForUser(
  svc: Svc,
  userId: string,
): Promise<AdminProjectRow[]> {
  return pageThrough<AdminProjectRow>((from, to) =>
    svc
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchIcons(svc: Svc): Promise<AdminIconRow[]> {
  return pageThrough<AdminIconRow>((from, to) =>
    svc
      .from("icons")
      .select("id,user_id,prompt,style,download_count,created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchIconsForUser(
  svc: Svc,
  userId: string,
): Promise<AdminIconRow[]> {
  return pageThrough<AdminIconRow>((from, to) =>
    svc
      .from("icons")
      .select("id,user_id,prompt,style,download_count,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

// ─── Credits & payments ──────────────────────────────────────────────────────

export async function fetchPurchases(svc: Svc): Promise<AdminPurchaseRow[]> {
  return pageThrough<AdminPurchaseRow>((from, to) =>
    svc
      .from("purchases")
      .select(PURCHASE_COLUMNS)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchPurchasesForUser(
  svc: Svc,
  userId: string,
): Promise<AdminPurchaseRow[]> {
  return pageThrough<AdminPurchaseRow>((from, to) =>
    svc
      .from("purchases")
      .select(PURCHASE_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchCredits(svc: Svc): Promise<AdminCreditRow[]> {
  return pageThrough<AdminCreditRow>((from, to) =>
    svc
      .from("user_credits")
      .select("user_id,balance_units,lifetime_granted,lifetime_spent,updated_at")
      .order("balance_units", { ascending: false })
      .range(from, to),
  );
}

export async function fetchCreditsForUser(
  svc: Svc,
  userId: string,
): Promise<AdminCreditRow | null> {
  const { data } = await svc
    .from("user_credits")
    .select("user_id,balance_units,lifetime_granted,lifetime_spent,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as AdminCreditRow | null) ?? null;
}

export async function fetchLedgerForUser(
  svc: Svc,
  userId: string,
): Promise<AdminLedgerRow[]> {
  return pageThrough<AdminLedgerRow>((from, to) =>
    svc
      .from("credit_ledger")
      .select("id,user_id,delta_units,reason,balance_after,idempotency_key,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

/**
 * Spend totals per reason, across all users.
 *
 * Read from the ledger rather than from lifetime_spent so the numbers can be
 * broken down by what the credits were actually used for.
 */
export async function fetchLedger(svc: Svc): Promise<AdminLedgerRow[]> {
  return pageThrough<AdminLedgerRow>((from, to) =>
    svc
      .from("credit_ledger")
      .select("id,user_id,delta_units,reason,balance_after,idempotency_key,created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchFeedbackForUser(
  svc: Svc,
  userId: string,
): Promise<AdminFeedbackRow[]> {
  return pageThrough<AdminFeedbackRow>((from, to) =>
    svc
      .from("feedback")
      .select("id,user_id,page,rating,message,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchFeedback(svc: Svc): Promise<AdminFeedbackRow[]> {
  return pageThrough<AdminFeedbackRow>((from, to) =>
    svc
      .from("feedback")
      .select("id,user_id,page,rating,message,created_at")
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

export interface DayStats {
  day: string;
  conversions: number;
  ready: number;
  errored: number;
  inFlight: number;
  icons: number;
  signedInUsers: number;
  guestConversions: number;
}

export function buildDailyStats(
  projects: AdminProjectRow[],
  icons: AdminIconRow[],
  days: string[],
): DayStats[] {
  const byDay = new Map<string, DayStats>();
  const usersByDay = new Map<string, Set<string>>();

  for (const day of days) {
    byDay.set(day, {
      day,
      conversions: 0,
      ready: 0,
      errored: 0,
      inFlight: 0,
      icons: 0,
      signedInUsers: 0,
      guestConversions: 0,
    });
    usersByDay.set(day, new Set());
  }

  for (const p of projects) {
    const stat = byDay.get(toDay(p.created_at));
    if (!stat) continue;
    stat.conversions += 1;
    if (p.status === "ready") stat.ready += 1;
    else if (p.status === "error") stat.errored += 1;
    else stat.inFlight += 1;
    if (p.user_id) usersByDay.get(stat.day)?.add(p.user_id);
    else stat.guestConversions += 1;
  }

  for (const icon of icons) {
    const stat = byDay.get(toDay(icon.created_at));
    if (!stat) continue;
    stat.icons += 1;
    if (icon.user_id) usersByDay.get(stat.day)?.add(icon.user_id);
  }

  for (const stat of byDay.values()) {
    stat.signedInUsers = usersByDay.get(stat.day)?.size ?? 0;
  }

  return days.map((d) => byDay.get(d) as DayStats);
}

export interface UserActivity {
  projects: number;
  ready: number;
  errored: number;
  icons: number;
  feedback: number;
  firstActivity: string | null;
  lastActivity: string | null;
}

function emptyActivity(): UserActivity {
  return {
    projects: 0,
    ready: 0,
    errored: 0,
    icons: 0,
    feedback: 0,
    firstActivity: null,
    lastActivity: null,
  };
}

function touch(activity: UserActivity, at: string): void {
  if (!activity.firstActivity || at < activity.firstActivity) {
    activity.firstActivity = at;
  }
  if (!activity.lastActivity || at > activity.lastActivity) {
    activity.lastActivity = at;
  }
}

export function buildUserActivity(
  projects: AdminProjectRow[],
  icons: AdminIconRow[],
  feedback: AdminFeedbackRow[],
): Map<string, UserActivity> {
  const map = new Map<string, UserActivity>();
  const get = (id: string) => {
    let a = map.get(id);
    if (!a) {
      a = emptyActivity();
      map.set(id, a);
    }
    return a;
  };

  for (const p of projects) {
    if (!p.user_id) continue;
    const a = get(p.user_id);
    a.projects += 1;
    if (p.status === "ready") a.ready += 1;
    else if (p.status === "error") a.errored += 1;
    touch(a, p.created_at);
  }
  for (const i of icons) {
    if (!i.user_id) continue;
    const a = get(i.user_id);
    a.icons += 1;
    touch(a, i.created_at);
  }
  for (const f of feedback) {
    if (!f.user_id) continue;
    const a = get(f.user_id);
    a.feedback += 1;
    touch(a, f.created_at);
  }
  return map;
}

// ─── Clerk directory ─────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  banned: boolean;
  locked: boolean;
  twoFactorEnabled: boolean;
}

function toAdminUser(u: {
  id: string;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
  banned: boolean;
  locked: boolean;
  twoFactorEnabled: boolean;
}): AdminUser {
  const primary =
    u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId) ??
    u.emailAddresses[0];
  return {
    id: u.id,
    email: primary?.emailAddress ?? null,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
    imageUrl: u.imageUrl || null,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
    lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).toISOString() : null,
    banned: Boolean(u.banned),
    locked: Boolean(u.locked),
    twoFactorEnabled: Boolean(u.twoFactorEnabled),
  };
}

/** Every Clerk user, newest first. Paged 500 at a time (Clerk's max). */
export async function fetchClerkUsers(cap = 5_000): Promise<AdminUser[]> {
  const client = await clerkClient();
  const out: AdminUser[] = [];
  const limit = 500;

  for (let offset = 0; offset < cap; offset += limit) {
    const { data } = await client.users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });
    for (const u of data) out.push(toAdminUser(u));
    if (data.length < limit) break;
  }
  return out;
}

export async function fetchClerkUser(userId: string): Promise<AdminUser | null> {
  try {
    const client = await clerkClient();
    const u = await client.users.getUser(userId);
    return toAdminUser(u);
  } catch {
    // Deleted in Clerk but rows still reference the id.
    return null;
  }
}

// ─── Storage previews ────────────────────────────────────────────────────────

const SIGNED_URL_TTL = 600; // 10 minutes — long enough to browse, short enough to leak little

/**
 * Signs storage paths in bulk. Returns a path → URL map; paths whose object is
 * gone are simply omitted so callers render a placeholder.
 *
 * R2 presigning is local and never fails for a missing key, so existence has to
 * be probed — otherwise the portal would show broken images for deleted files
 * rather than the placeholder.
 */
export async function signPaths(
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  const map = new Map<string, string>();

  await Promise.all(
    unique.map(async (path) => {
      if (!(await objectExists(path))) return;
      map.set(path, await signedDownloadUrl(path, SIGNED_URL_TTL));
    }),
  );

  return map;
}

export { createServiceClient };
export type { Svc };
