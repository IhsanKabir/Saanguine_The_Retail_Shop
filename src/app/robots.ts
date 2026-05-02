import type { MetadataRoute } from "next";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine-the-retail-shop.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",         // private operations area
          "/api",           // server actions / webhook endpoints
          "/auth",          // OAuth callback handlers
          "/account",       // signed-in only
          "/checkout",      // transactional, not indexable
          "/preorder",      // signed-in bespoke request form
          "/*?*",           // anything with query parameters (cart state etc)
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
