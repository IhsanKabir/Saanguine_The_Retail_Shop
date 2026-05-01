import { getAllSegments } from "@/lib/queries";
import { db, schema } from "@/lib/db";
import SegmentsClient from "./SegmentsClient";
import { requirePermission } from "@/lib/auth-utils";

export default async function AdminSegmentsPage() {
  await requirePermission("segments");
  const [segments, products] = await Promise.all([
    getAllSegments(),
    db.select().from(schema.products),
  ]);
  return <SegmentsClient segments={segments} products={products} />;
}
