import type { MetadataRoute } from "next";

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
    sitemap: "https://vectordrop.co.in/sitemap.xml",
  };
}
