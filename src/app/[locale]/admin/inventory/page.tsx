import { db, schema } from "@/lib/db";
import { asc } from "drizzle-orm";
import InventoryClient from "./InventoryClient";
import { requirePermission } from "@/lib/auth-utils";

export default async function AdminInventoryPage() {
  const ctx = await requirePermission("inventory");
  const [products, segments] = await Promise.all([
    db.select().from(schema.products).orderBy(asc(schema.products.id)),
    db.select().from(schema.segments).orderBy(asc(schema.segments.sortOrder)),
  ]);
  return <InventoryClient products={products} segments={segments} canSeeRevenue={ctx.has("revenue")} />;
}
