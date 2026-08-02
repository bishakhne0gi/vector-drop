import { describe, expect, it } from "vitest";
import { isAdminEmail, ADMIN_EMAILS } from "@/lib/admin/config";
import {
  buildDailyStats,
  buildUserActivity,
  type AdminFeedbackRow,
  type AdminIconRow,
  type AdminProjectRow,
} from "@/lib/admin/queries";

function project(over: Partial<AdminProjectRow>): AdminProjectRow {
  return {
    id: crypto.randomUUID(),
    user_id: "user_a",
    name: "logo.png",
    status: "ready",
    source_image_path: "projects/user_a/x/logo.png",
    svg_path: "projects/user_a/x/logo.svg",
    error_message: null,
    created_at: "2026-08-03T06:00:00.000Z",
    updated_at: "2026-08-03T06:00:00.000Z",
    ...over,
  };
}

function icon(over: Partial<AdminIconRow>): AdminIconRow {
  return {
    id: crypto.randomUUID(),
    user_id: "user_a",
    prompt: "rocket",
    style: "flat",
    download_count: 0,
    created_at: "2026-08-03T06:00:00.000Z",
    ...over,
  };
}

describe("isAdminEmail", () => {
  it("accepts the configured owner address", () => {
    expect(isAdminEmail(ADMIN_EMAILS[0])).toBe(true);
  });

  it("is case and whitespace insensitive", () => {
    expect(isAdminEmail(`  ${ADMIN_EMAILS[0].toUpperCase()}  `)).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isAdminEmail("someone@else.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("rejects a lookalike that merely contains the admin address", () => {
    expect(isAdminEmail(`${ADMIN_EMAILS[0]}.attacker.com`)).toBe(false);
    expect(isAdminEmail(`x+${ADMIN_EMAILS[0]}`)).toBe(false);
  });
});

describe("buildDailyStats", () => {
  const days = ["2026-08-03", "2026-08-02"];

  it("buckets conversions by day and status", () => {
    const stats = buildDailyStats(
      [
        project({ created_at: "2026-08-03T06:00:00.000Z", status: "ready" }),
        project({ created_at: "2026-08-03T07:00:00.000Z", status: "error" }),
        project({ created_at: "2026-08-03T08:00:00.000Z", status: "converting" }),
        project({ created_at: "2026-08-02T09:00:00.000Z", status: "ready" }),
      ],
      [],
      days,
    );

    expect(stats[0]).toMatchObject({
      day: "2026-08-03",
      conversions: 3,
      ready: 1,
      errored: 1,
      inFlight: 1,
    });
    expect(stats[1]).toMatchObject({ day: "2026-08-02", conversions: 1, ready: 1 });
  });

  it("counts unique signed-in users and guest conversions separately", () => {
    const stats = buildDailyStats(
      [
        project({ user_id: "user_a" }),
        project({ user_id: "user_a" }),
        project({ user_id: "user_b" }),
        project({ user_id: null }),
      ],
      [icon({ user_id: "user_c" })],
      days,
    );

    expect(stats[0].signedInUsers).toBe(3); // a, b, c — not the guest
    expect(stats[0].guestConversions).toBe(1);
    expect(stats[0].icons).toBe(1);
  });

  it("ignores rows outside the requested window", () => {
    const stats = buildDailyStats(
      [project({ created_at: "2025-01-01T00:00:00.000Z" })],
      [],
      days,
    );
    expect(stats.every((s) => s.conversions === 0)).toBe(true);
  });

  it("returns a row for every requested day, in order", () => {
    const stats = buildDailyStats([], [], days);
    expect(stats.map((s) => s.day)).toEqual(days);
  });
});

describe("buildUserActivity", () => {
  it("aggregates projects, icons and feedback per user", () => {
    const feedback: AdminFeedbackRow[] = [
      {
        id: "f1",
        user_id: "user_a",
        page: "dashboard",
        rating: 5,
        message: "nice",
        created_at: "2026-08-03T10:00:00.000Z",
      },
    ];

    const map = buildUserActivity(
      [
        project({ user_id: "user_a", status: "ready", created_at: "2026-08-01T00:00:00.000Z" }),
        project({ user_id: "user_a", status: "error", created_at: "2026-08-02T00:00:00.000Z" }),
        project({ user_id: null }),
      ],
      [icon({ user_id: "user_a", created_at: "2026-08-03T00:00:00.000Z" })],
      feedback,
    );

    const a = map.get("user_a");
    expect(a).toMatchObject({
      projects: 2,
      ready: 1,
      errored: 1,
      icons: 1,
      feedback: 1,
    });
    expect(a?.firstActivity).toBe("2026-08-01T00:00:00.000Z");
    expect(a?.lastActivity).toBe("2026-08-03T10:00:00.000Z");
  });

  it("never creates an entry for guest rows", () => {
    const map = buildUserActivity([project({ user_id: null })], [], []);
    expect(map.size).toBe(0);
  });
});
