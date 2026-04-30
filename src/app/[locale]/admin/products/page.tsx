import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import ProductsClient from "./ProductsClient";

export default async function AdminProductsPage() {
  const [segments, products] = await Promise.all([
    db.select().from(schema.segments).orderBy(asc(schema.segments.sortOrder)),
    db.select().from(schema.products).orderBy(schema.products.id),
  ]);
  return <ProductsClient segments={segments} products={products} />;
}
