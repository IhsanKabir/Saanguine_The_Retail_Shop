import { db, schema } from "@/lib/db";
import { desc, inArray } from "drizzle-orm";
import OrdersClient from "./OrdersClient";
import { requirePermission } from "@/lib/auth-utils";

export default async function AdminOrdersPage() {
  await requirePermission("orders");
  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(200);
  const orderIds = orders.map((o) => o.id);
  const lines = orderIds.length
    ? await db.select().from(schema.orderLines).where(inArray(schema.orderLines.orderId, orderIds))
    : [];
  return <OrdersClient orders={orders} lines={lines} />;
}
