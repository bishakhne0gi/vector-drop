import type { MetadataRoute } from "next";
import { comparisons } from "@/lib/pseo/comparisons";
import { formats } from "@/lib/pseo/formats";
import { useCases } from "@/lib/pseo/use-cases";
import { howTos } from "@/lib/pseo/how-tos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://vectordrop.co.in";
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

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
