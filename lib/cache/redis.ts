import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { AppError } from "@/lib/types";

// ─── Client ──────────────────────────────────────────────────────────────────

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Rate Limiters ───────────────────────────────────────────────────────────

/** 60 general API reads / 60s sliding window per user */
export const readRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "ratelimit:read",
});

/** 30 write operations / 60s sliding window per user */
export const writeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "ratelimit:write",
});

/** 5 conversions / 60s sliding window per user */
export const convertRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:convert",
});

/** 10 AI calls / 60s sliding window per user */
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:ai",
});

/** 10 icon generations / 3600s sliding window per user */
export const aiGenerateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "3600 s"),
  prefix: "ratelimit:ai:generate",
});

// ─── Rate Limit Helper ────────────────────────────────────────────────────────

export async function enforceRateLimit(
  limiter: Ratelimit,
  userId: string,
): Promise<{ remaining: number; reset: number }> {
  const { success, remaining, reset } = await limiter.limit(userId);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    throw AppError.rateLimited(retryAfter);
  }
  return { remaining, reset };
}

// ─── Cache Key Builders ───────────────────────────────────────────────────────

export const cacheKeys = {
  conversion: (sha256: string, colorCount: number) =>
    `conv:${sha256}:${colorCount}`,
  aiAnalysis: (imageHash: string) => `ai:analysis:${imageHash}`,
  aiRestyle: (imageHash: string, themeId: string) =>
    `ai:restyle:${imageHash}:${themeId}`,
} as const;

// ─── TTLs (seconds) ───────────────────────────────────────────────────────────

export const TTL = {
  CONVERSION: 60 * 60 * 24 * 30, // 30 days
  AI_ANALYSIS: 60 * 60 * 24 * 7, // 7 days
  AI_RESTYLE: 60 * 60 * 24 * 3,  // 3 days
} as const;

// ─── Typed get/set helpers ────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (err) {
    // Cache errors must not crash the pipeline — log and return null
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        route: "cache:get",
        userId: null,
        error: { code: "CACHE_ERROR", message: String(err), context: { key } },
      }),
    );
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        route: "cache:set",
        userId: null,
        error: { code: "CACHE_ERROR", message: String(err), context: { key } },
      }),
    );
    // Do not throw — a cache write failure is non-fatal
  }
}
