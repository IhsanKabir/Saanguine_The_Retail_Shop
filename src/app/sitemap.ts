import type { MetadataRoute } from "next";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/sign-in", "/wishlist", "/cart"];

  let segments: { id: string }[] = [];
  let products: { slug: string; updatedAt: Date | null }[] = [];
  try {
    segments = await db.select({ id: schema.segments.id })
      .from(schema.segments).where(eq(schema.segments.hidden, false));
    products = await db.select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt })
      .from(schema.products).where(eq(schema.products.status, "live"));
  } catch {}

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of ["en", "bn"]) {
    for (const r of staticRoutes) {
      entries.push({
        url: `${BASE}/${locale}${r}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: r === "" ? 1.0 : 0.6,
      });
    }
    for (const s of segments) {
      entries.push({ url: `${BASE}/${locale}/shop/${s.id}`, changeFrequency: "weekly", priority: 0.8 });
    }
    for (const p of products) {
      entries.push({
        url: `${BASE}/${locale}/product/${p.slug}`,
        lastModified: p.updatedAt || undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  return entries;
}
