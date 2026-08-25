import { ADSENSE_PUBLISHER_ID } from "@/lib/adsense";

/**
 * Serves /ads.txt from the configured publisher ID.
 *
 * Generated rather than committed to /public so the file can never drift from
 * NEXT_PUBLIC_ADSENSE_CLIENT, and so it simply doesn't exist until a real
 * publisher ID is set.
 */
export function GET() {
  if (!ADSENSE_PUBLISHER_ID) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(
    `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
