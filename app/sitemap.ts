import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { comparisons } from "@/lib/pseo/comparisons";
import { formats } from "@/lib/pseo/formats";
import { useCases } from "@/lib/pseo/use-cases";
import { howTos } from "@/lib/pseo/how-tos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  entries.push({
    url: `${base}/pricing`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  });

  // Cluster hubs — crawl entry points for each pSEO section.
  for (const hub of ["convert", "vs", "how-to", "for"]) {
    entries.push({
      url: `${base}/${hub}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  for (const c of comparisons) {
    entries.push({
      url: `${base}/vs/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const f of formats) {
    entries.push({
      url: `${base}/convert/${f.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    });
  }

  for (const u of useCases) {
    entries.push({
      url: `${base}/for/${u.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const h of howTos) {
    entries.push({
      url: `${base}/how-to/${h.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
