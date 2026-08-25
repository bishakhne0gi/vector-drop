/**
 * IndexNow — instant URL submission to Bing (and Yandex, Seznam, Naver).
 *
 * Bing's normal discovery crawl can take days to notice a new or changed page.
 * IndexNow pushes the URL the moment it changes, which is the single biggest
 * lever on "how fast does Bing pick this up". Bing shares its index with
 * downstream consumers, so faster Bing indexing also means faster availability
 * to assistants that read from that index.
 *
 * The key must be served as plain text at `${SITE_URL}/${INDEXNOW_KEY}.txt`,
 * containing exactly the key. See `public/<key>.txt`.
 */
export const INDEXNOW_KEY = "2d61a28d203d17e256c36648c94658fb";

const ENDPOINT = "https://api.indexnow.org/IndexNow";

/** Max URLs IndexNow accepts in a single batch submission. */
const BATCH_LIMIT = 10_000;

export type IndexNowResult = {
  submitted: number;
  status: number;
  ok: boolean;
  body: string;
};

/**
 * Submit absolute URLs to IndexNow.
 *
 * All URLs must share the host of `siteUrl` — IndexNow rejects mixed hosts,
 * and silently ignores URLs that redirect, so pass canonical (www) URLs.
 */
export async function submitToIndexNow(
  urls: string[],
  siteUrl: string,
): Promise<IndexNowResult> {
  const host = new URL(siteUrl).host;
  const urlList = [...new Set(urls)].slice(0, BATCH_LIMIT);

  const offHost = urlList.filter((u) => new URL(u).host !== host);
  if (offHost.length > 0) {
    throw new Error(
      `IndexNow rejects mixed hosts. Expected ${host}, got: ${offHost.slice(0, 3).join(", ")}`,
    );
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  return {
    submitted: urlList.length,
    status: res.status,
    ok: res.ok,
    body: await res.text(),
  };
}
