"use server";

import { db, schema } from "@/lib/db";
import { sql, and, gte, lte, desc, eq } from "drizzle-orm";
import { requirePermission } from "@/lib/auth-utils";

export type DateRange = { from: Date; to: Date };

/**
 * Sales rollup for a date range. Used by both the in-app report
 * and the CSV export action.
 */
export async function getSalesData(range: DateRange) {
  const ctx = await requirePermission("reports");
  const canSeeRevenue = ctx.has("revenue");
  const cond = and(
    gte(schema.orders.createdAt, range.from),
    lte(schema.orders.createdAt, range.to),
  );

  const [{ orders, revenue, units }] = await db.execute<{ orders: number; revenue: number; units: number }>(sql`
    select
      count(*)::int as orders,
      coalesce(sum(${schema.orders.totalBdt}), 0)::int as revenue,
      coalesce((select sum(${schema.orderLines.qty})::int
        from ${schema.orderLines}
        where ${schema.orderLines.orderId} in (select id from ${schema.orders} where ${cond})
      ), 0) as units
    from ${schema.orders}
    where ${cond}
  `);

  const aov = orders > 0 ? Math.round(revenue / orders) : 0;

  const byStatus = await db.execute<{ status: string; count: number; total: number }>(sql`
    select ${schema.orders.status} as status, count(*)::int as count, coalesce(sum(${schema.orders.totalBdt}), 0)::int as total
    from ${schema.orders}
    where ${cond}
    group by status
    order by count desc
  `);

  const byPayment = await db.execute<{ method: string; count: number; total: number }>(sql`
    select ${schema.orders.paymentMethod} as method, count(*)::int as count, coalesce(sum(${schema.orders.totalBdt}), 0)::int as total
    from ${schema.orders}
    where ${cond}
    group by method
    order by count desc
  `);

  const bySegment = await db.execute<{ segment_id: string; segment_name: string; units: number; revenue: number }>(sql`
    select
      ${schema.products.segmentId} as segment_id,
      ${schema.segments.name} as segment_name,
      sum(${schema.orderLines.qty})::int as units,
      sum(${schema.orderLines.lineTotalBdt})::int as revenue
    from ${schema.orderLines}
    join ${schema.orders} on ${schema.orderLines.orderId} = ${schema.orders.id}
    left join ${schema.products} on ${schema.orderLines.productId} = ${schema.products.id}
    left join ${schema.segments} on ${schema.products.segmentId} = ${schema.segments.id}
    where ${cond}
    group by ${schema.products.segmentId}, ${schema.segments.name}
    order by revenue desc nulls last
  `);

  const byCity = await db.execute<{ city: string; count: number; total: number }>(sql`
    select coalesce(${schema.orders.shippingAddress}->>'city', '—') as city,
           count(*)::int as count,
           coalesce(sum(${schema.orders.totalBdt}), 0)::int as total
    from ${schema.orders}
    where ${cond}
    group by city
    order by count desc
    limit 12
  `);

  const byDay = await db.execute<{ day: string; count: number; total: number }>(sql`
    select to_char(${schema.orders.createdAt}, 'YYYY-MM-DD') as day,
           count(*)::int as count,
           coalesce(sum(${schema.orders.totalBdt}), 0)::int as total
    from ${schema.orders}
    where ${cond}
    group by day
    order by day asc
  `);

  const topProducts = await db.execute<{ product_id: string; name: string; sku: string; units: number; revenue: number }>(sql`
    select
      ${schema.orderLines.productId} as product_id,
      ${schema.orderLines.nameSnapshot} as name,
      ${schema.orderLines.skuSnapshot} as sku,
      sum(${schema.orderLines.qty})::int as units,
      sum(${schema.orderLines.lineTotalBdt})::int as revenue
    from ${schema.orderLines}
    join ${schema.orders} on ${schema.orderLines.orderId} = ${schema.orders.id}
    where ${cond}
    group by product_id, name, sku
    order by revenue desc
    limit 10
  `);

  return {
    range,
    canSeeRevenue,
    summary: { orders, revenue, units, aov },
    byStatus,
    byPayment,
    bySegment,
    byCity,
    byDay,
    topProducts,
  };
}

/**
 * Cash-on-Delivery reconciliation. Owner-of-the-house ops view.
 * Surfaces outstanding cash, late remittance, courier-by-courier.
 */
export async function getCodReconciliation(range: DateRange) {
  await requirePermission("reports");
  const cond = and(
    gte(schema.orders.createdAt, range.from),
    lte(schema.orders.createdAt, range.to),
    eq(schema.orders.paymentMethod, "cod"),
  );

  const summary = await db.execute<{
    courier: string | null;
    status: string;
    count: number;
    total: number;
  }>(sql`
    select coalesce(${schema.orders.shippingCourier}, '— not booked') as courier,
           ${schema.orders.status} as status,
           count(*)::int as count,
           coalesce(sum(${schema.orders.totalBdt}), 0)::int as total
    from ${schema.orders}
    where ${cond}
    group by courier, status
    order by courier, status
  `);

  const stale = await db.execute<{
    id: string; number: string; status: string; total: number; courier: string | null; tracking: string | null; days_old: number;
  }>(sql`
    select id::text as id,
           number,
           ${schema.orders.status} as status,
           ${schema.orders.totalBdt} as total,
           ${schema.orders.shippingCourier} as courier,
           ${schema.orders.shippingTracking} as tracking,
           extract(day from now() - ${schema.orders.createdAt})::int as days_old
    from ${schema.orders}
    where ${cond}
      and ${schema.orders.status} in ('cod_pending', 'shipped')
      and ${schema.orders.createdAt} < now() - interval '7 days'
    order by ${schema.orders.createdAt} asc
    limit 50
  `);

  return { range, summary, stale };
}

/**
 * CSV export of orders in range. Returns a string that the client downloads.
 */
export async function exportSalesCsv(range: DateRange): Promise<string> {
  await requirePermission("reports");
  const orders = await db.select().from(schema.orders)
    .where(and(
      gte(schema.orders.createdAt, range.from),
      lte(schema.orders.createdAt, range.to),
    ))
    .orderBy(desc(schema.orders.createdAt));

  const header = [
    "order_number", "created_at", "status", "payment_method", "courier", "tracking",
    "customer_name", "customer_email", "customer_phone",
    "city", "subtotal_bdt", "shipping_bdt", "cod_fee_bdt", "total_bdt",
  ].join(",");

  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };

  const rows = orders.map((o) => {
    const a = o.shippingAddress as { fullName?: string; phone?: string; city?: string };
    return [
      o.number,
      o.createdAt?.toISOString() ?? "",
      o.status,
      o.paymentMethod,
      o.shippingCourier ?? "",
      o.shippingTracking ?? "",
      a.fullName ?? "",
      o.guestEmail ?? "",
      a.phone ?? o.guestPhone ?? "",
      a.city ?? "",
      o.subtotalBdt,
      o.shippingBdt,
      o.codFeeBdt,
      o.totalBdt,
    ].map(escape).join(",");
  });

  return [header, ...rows].join("\n");
}
