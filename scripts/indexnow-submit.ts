/**
 * Push every canonical URL in the sitemap to IndexNow so Bing sees changes
 * immediately instead of waiting for its discovery crawl.
 *
 * Run after any deploy that adds or materially changes pages:
 *   npx tsx scripts/indexnow-submit.ts
 *
 * Safe to re-run — IndexNow is idempotent and expects repeat submissions only
 * when content actually changed. Do not run it on a cron for unchanged pages;
 * Bing treats that as spam signalling.
 */
import { SITE_URL } from "../lib/seo/site";
import { submitToIndexNow } from "../lib/seo/indexnow";
import sitemap from "../app/sitemap";

async function main() {
  const urls = sitemap().map((entry) => entry.url);
  console.log(`Submitting ${urls.length} URLs to IndexNow for ${SITE_URL}…`);

  const result = await submitToIndexNow(urls, SITE_URL);

  if (result.ok) {
    console.log(`✓ Accepted ${result.submitted} URLs (HTTP ${result.status})`);
    return;
  }

  console.error(`✗ IndexNow returned HTTP ${result.status}: ${result.body}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
