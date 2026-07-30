import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/vs/",
        "/convert/",
        "/for/",
        "/how-to/",
      ],
      disallow: [
        "/api/",
        "/dashboard",
        "/editor",
        "/icons/my",
        "/login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
