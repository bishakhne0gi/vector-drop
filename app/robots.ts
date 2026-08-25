import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/** Private surfaces — no crawler, conventional or AI, should index these. */
const DISALLOW = ["/api/", "/dashboard", "/editor", "/icons/my", "/login"];

/**
 * Crawlers that decide whether we can be cited by an AI assistant.
 *
 * These are listed explicitly rather than relying on the `*` rule so that
 * tightening `*` later cannot silently cut off AI citation traffic.
 *
 * - OAI-SearchBot  — builds the index ChatGPT search answers from. This is the
 *                    one that determines whether ChatGPT can cite us at all.
 * - ChatGPT-User   — live fetch when a user's question triggers a page visit.
 * - PerplexityBot  — Perplexity's index.
 * - ClaudeBot      — Anthropic's crawler.
 * - Google-Extended — gates Gemini / AI Overviews use of our content.
 * - bingbot        — Bing's index, which several assistants read from.
 *
 * GPTBot is deliberately excluded from this list: it is OpenAI's *training*
 * crawler, not the search crawler, so allowing it does nothing for citations.
 * It falls under the `*` rule below, which currently allows it. Add an explicit
 * disallow for GPTBot if you decide you do not want the content used for
 * model training — that choice is independent of AI search visibility.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Google-Extended",
  "bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
