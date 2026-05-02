"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, sum, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/auth-utils";
import { logOrderEvent } from "@/lib/order-events";

const refundSchema = z.object({
  orderId: z.string().uuid(),
  amountBdt: z.number().int().min(1).max(10_000_000),
  reason: z.string().min(1).max(500),
  method: z.enum(["bkash", "bank", "cash", "card"]),
  recipientInfo: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  /** If true, set the order status to 'refunded'. False = partial refund, leave status as-is. */
  fullRefund: z.boolean().default(true),
});

export async function issueRefund(input: z.infer<typeof refundSchema>) {
  const ctx = await requirePermission("orders");
  const data = refundSchema.parse(input);

  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, data.orderId));
  if (!order) return { ok: false as const, error: "Order not found" };

  // Don't allow over-refunding the order total. Sum existing refunds first.
  const [existing] = await db.select({ total: sum(schema.refunds.amountBdt) }).from(schema.refunds)
    .where(eq(schema.refunds.orderId, data.orderId));
  const alreadyRefunded = Number(existing?.total ?? 0);
  if (alreadyRefunded + data.amountBdt > order.totalBdt) {
    return {
      ok: false as const,
      error: `Refund exceeds order total. Already refunded ৳${alreadyRefunded.toLocaleString("en-IN")}, attempting ৳${data.amountBdt.toLocaleString("en-IN")} more, order is ৳${order.totalBdt.toLocaleString("en-IN")}.`,
    };
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.refunds).values({
      orderId: data.orderId,
      amountBdt: data.amountBdt,
      reason: data.reason,
      method: data.method,
      recipientInfo: data.recipientInfo ?? null,
      processedBy: ctx.user.id,
      processedByEmail: ctx.user.email ?? null,
      notes: data.notes ?? null,
    });
    if (data.fullRefund) {
      await tx.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, data.orderId));
    }
  });

  await logOrderEvent({
    orderId: data.orderId,
    type: "refund_issued",
    payload: {
      amount: data.amountBdt,
      method: data.method,
      reason: data.reason,
      full: data.fullRefund,
    },
  });

  revalidatePath("/[locale]/admin/orders", "page");
  return { ok: true as const };
}

export async function listRefundsForOrder(orderId: string) {
  await requirePermission("orders");
  return db.select().from(schema.refunds)
    .where(eq(schema.refunds.orderId, orderId))
    .orderBy(schema.refunds.createdAt);
}
