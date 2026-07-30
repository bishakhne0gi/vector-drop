/**
 * Canonical origin for the site.
 *
 * IMPORTANT: this MUST match the host that actually serves a 200.
 * The apex (vectordrop.co.in) redirects to www at the platform level, so www is
 * canonical. Pointing canonical tags at the apex creates a redirect/canonical
 * contradiction that stops Google from indexing pages at all.
 */
export const SITE_URL = "https://www.vectordrop.co.in";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
