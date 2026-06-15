import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The authenticated app is behind a login and shouldn't be indexed.
      disallow: ["/dashboard", "/jobs", "/projects", "/settings", "/onboarding"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
