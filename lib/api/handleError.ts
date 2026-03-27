import { AppError, LogEntry } from "@/lib/types";

function log(entry: Omit<LogEntry, "timestamp">): void {
  console.error(JSON.stringify({ timestamp: new Date().toISOString(), ...entry }));
}

export function handleError(
  err: unknown,
  route: string,
  userId: string | null,
  durationMs?: number,
): Response {
  if (err instanceof AppError) {
    log({
      level: "error",
      route,
      userId,
      durationMs,
      error: { code: err.code, message: err.message, context: err.context },
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (err.code === "RATE_LIMITED" && err.context?.retryAfterSeconds) {
      headers["Retry-After"] = String(err.context.retryAfterSeconds);
      headers["X-RateLimit-Remaining"] = "0";
    }

    return Response.json(
      { error: { code: err.code, message: err.message } },
      { status: err.statusCode, headers },
    );
  }

  // Unknown error — don't leak internals
  log({
    level: "error",
    route,
    userId,
    durationMs,
    error: {
      code: "INTERNAL_ERROR",
      message: err instanceof Error ? err.message : String(err),
    },
  });

  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 },
  );
}
