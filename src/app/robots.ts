import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/auth", "/account", "/checkout"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
