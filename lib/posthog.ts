import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

/**
 * Server-side PostHog client (singleton).
 * Used in API routes for server-side event capture.
 */
export function getPostHogServer(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0, // Flush immediately in serverless
    });
  }
  return _client;
}
