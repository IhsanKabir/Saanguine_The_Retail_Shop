import { getAllSegments } from "@/lib/queries";
import { db, schema } from "@/lib/db";
import SegmentsClient from "./SegmentsClient";

export default async function AdminSegmentsPage() {
  const [segments, products] = await Promise.all([
    getAllSegments(),
    db.select().from(schema.products),
  ]);
  return <SegmentsClient segments={segments} products={products} />;
}
