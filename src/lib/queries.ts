import { db } from "./db";
import { segments, products, productImages } from "./schema";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

// ─── Segments ──────────────────────────────────────────────────────────
export async function getVisibleSegments() {
  return db.select().from(segments)
    .where(eq(segments.hidden, false))
    .orderBy(asc(segments.sortOrder));
}

export async function getAllSegments() {
  return db.select().from(segments).orderBy(asc(segments.sortOrder));
}

export async function getSegmentBySlug(id: string) {
  const rows = await db.select().from(segments).where(eq(segments.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Products ──────────────────────────────────────────────────────────
export async function getLiveProducts(opts?: {
  segmentId?: string;
  tag?: string;
  limit?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
}) {
  const conds = [eq(products.status, "live")];
  if (opts?.segmentId) conds.push(eq(products.segmentId, opts.segmentId));
  if (opts?.tag) conds.push(eq(products.tag, opts.tag));

  const orderBy = (() => {
    switch (opts?.sort) {
      case "price-asc":  return asc(products.priceBdt);
      case "price-desc": return desc(products.priceBdt);
      case "rating":     return desc(products.rating);
      default:           return asc(products.id);
    }
  })();

  const q = db.select().from(products).where(and(...conds)).orderBy(orderBy);
  return opts?.limit ? q.limit(opts.limit) : q;
}

export async function getProductBySlug(slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getProductImages(productId: string) {
  return db.select().from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder));
}

export async function getRelatedProducts(productId: string, segmentId: string, limit = 4) {
  return db.select().from(products)
    .where(and(eq(products.status, "live"), eq(products.segmentId, segmentId), sql`${products.id} != ${productId}`))
    .limit(limit);
}

// ─── Search (Postgres full-text) ───────────────────────────────────────
export async function searchProducts(query: string, limit = 8) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  return db.select().from(products).where(
    and(
      eq(products.status, "live"),
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.sku, `%${q}%`),
      ),
    ),
  ).limit(limit);
}
