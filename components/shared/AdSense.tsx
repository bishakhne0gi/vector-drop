import Script from "next/script";
import { ADSENSE_CLIENT } from "@/lib/adsense";

/**
 * Loads the Google AdSense Auto ads tag.
 *
 * Rendered from the marketing surfaces only — the landing page and the
 * (marketing) route group — so the signed-in app (dashboard, editor, icons)
 * and /hades stay ad-free.
 *
 * `afterInteractive` keeps the tag off the critical path; AdSense injects its
 * own placements once it loads. Next dedupes by `id`, so rendering this from
 * both the landing page and the marketing layout loads the tag exactly once.
 */
export function AdSense() {
  if (!ADSENSE_CLIENT) return null;

  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
