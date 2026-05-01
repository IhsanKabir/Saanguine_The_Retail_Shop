import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import ProductsClient from "./ProductsClient";
import { requirePermission } from "@/lib/auth-utils";

export default async function AdminProductsPage() {
  await requirePermission("products");
  const [segments, products] = await Promise.all([
    db.select().from(schema.segments).orderBy(asc(schema.segments.sortOrder)),
    db.select().from(schema.products).orderBy(schema.products.id),
  ]);
  return <ProductsClient segments={segments} products={products} />;
}
