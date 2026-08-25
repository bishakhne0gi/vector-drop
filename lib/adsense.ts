/**
 * Google AdSense configuration.
 *
 * The publisher ID is public by nature (it ships in the page source and in
 * ads.txt), so it lives in a NEXT_PUBLIC_ var. Until it is set, every AdSense
 * surface no-ops: no script tag, and /ads.txt 404s rather than serving a file
 * with a placeholder in it — a wrong ads.txt is worse than no ads.txt, because
 * buyers read it as "this publisher does not authorise us".
 */

const raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();

/** `ca-pub-` followed by the 16-digit publisher number. */
const CLIENT_PATTERN = /^ca-pub-\d{16}$/;

export const ADSENSE_CLIENT: string | null =
  raw && CLIENT_PATTERN.test(raw) ? raw : null;

/** The bare publisher number, as ads.txt wants it (no `ca-` prefix). */
export const ADSENSE_PUBLISHER_ID: string | null = ADSENSE_CLIENT
  ? ADSENSE_CLIENT.replace(/^ca-/, "")
  : null;
