import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/lib/db";
import { parseShippingAddress } from "@/lib/schema";
import { eq, desc, and, sum, count } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth-utils";
import { formatBdt, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ email: string; locale: string }> };

export default async function AdminCustomerDetailPage({ params }: Props) {
  const ctx = await requirePermission("customers");
  const canSeeRevenue = ctx.has("revenue");
  const { locale, email: encEmail } = await params;
  setRequestLocale(locale);
  const email = decodeURIComponent(encEmail);

  // Pull all orders for this email (guest or signed-in).
  const orders = await db.select().from(schema.orders)
    .where(eq(schema.orders.guestEmail, email))
    .orderBy(desc(schema.orders.createdAt))
    .catch(() => []);

  if (orders.length === 0) notFound();

  const totalSpent = orders.reduce((s, o) => s + o.totalBdt, 0);
  const firstAddr = parseShippingAddress(orders[0].shippingAddress);
  const customerName = firstAddr.fullName ?? null;
  const customerPhone = firstAddr.phone ?? orders[0].guestPhone ?? null;
  const customerCity = firstAddr.city ?? null;

  // Reviews + preorders + refund-totals — gather in parallel.
  const [reviewRows, preorderRows, refundAgg] = await Promise.all([
    db.select().from(schema.reviews)
      .where(and(eq(schema.reviews.customerId, orders[0].customerId ?? "00000000-0000-0000-0000-000000000000")))
      .orderBy(desc(schema.reviews.createdAt))
      .catch(() => []),
    db.select().from(schema.preorderRequests)
      .where(eq(schema.preorderRequests.customerEmail, email))
      .orderBy(desc(schema.preorderRequests.createdAt))
      .catch(() => []),
    orders[0].customerId
      ? db.select({ total: sum(schema.refunds.amountBdt), n: count(schema.refunds.id) })
          .from(schema.refunds)
          .innerJoin(schema.orders, eq(schema.orders.id, schema.refunds.orderId))
          .where(eq(schema.orders.guestEmail, email))
          .catch(() => [{ total: 0, n: 0 }])
      : Promise.resolve([{ total: 0, n: 0 }]),
  ]);
  const refundTotal = Number(refundAgg[0]?.total ?? 0);
  const refundCount = Number(refundAgg[0]?.n ?? 0);

  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled" || o.status === "refunded").length;

  return (
    <>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
        <Link href="/admin/customers">← All customers</Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 16 }}>
        <div>
          <h1 className="admin-h1">{customerName ?? email.split("@")[0]}</h1>
          <p className="admin-sub">
            {email}{customerPhone ? ` · ${customerPhone}` : ""}{customerCity ? ` · ${customerCity}` : ""}
          </p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat kpi"><div className="kpi-top"><div className="k">Orders</div></div><div className="v">{orders.length}</div></div>
        <div className="stat kpi"><div className="kpi-top"><div className="k">Delivered</div></div><div className="v">{delivered}</div></div>
        <div className="stat kpi"><div className="kpi-top"><div className="k">Cancelled / refunded</div></div><div className="v">{cancelled}</div></div>
        {canSeeRevenue && (
          <div className="stat kpi">
            <div className="kpi-top"><div className="k">Lifetime spend</div></div>
            <div className="v">{formatBdt(totalSpent - refundTotal)}</div>
            {refundCount > 0 && (
              <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 4 }}>
                Net of {refundCount} refund{refundCount === 1 ? "" : "s"} ({formatBdt(refundTotal)})
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="serif" style={{ fontSize: 22, color: "var(--purple-900)", fontWeight: 500, marginTop: 28, marginBottom: 12 }}>
        Orders
      </h2>
      <div className="table">
        <table>
          <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th>Courier</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td style={{ fontFamily: "var(--mono)", color: "var(--purple-900)", fontWeight: 500 }}>{o.number}</td>
                <td>{o.createdAt ? formatDate(new Date(o.createdAt)) : "—"}</td>
                <td>
                  <span className={"pill " + (o.status === "delivered" ? "pill-ok" : o.status === "shipped" ? "pill-info" : o.status === "cancelled" || o.status === "refunded" ? "pill-err" : "pill-warn")}>
                    {o.status}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{formatBdt(o.totalBdt)}</td>
                <td style={{ fontSize: 12, color: "var(--ink-soft)", textTransform: "capitalize" }}>
                  {o.shippingCourier ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preorderRows.length > 0 && (
        <>
          <h2 className="serif" style={{ fontSize: 22, color: "var(--purple-900)", fontWeight: 500, marginTop: 32, marginBottom: 12 }}>
            Bespoke requests
          </h2>
          <div className="table">
            <table>
              <thead><tr><th>Date</th><th>Segment</th><th>Description</th><th>Status</th><th>Quote</th></tr></thead>
              <tbody>
                {preorderRows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, color: "var(--ink-soft)" }}>{formatDate(new Date(r.createdAt))}</td>
                    <td>{r.segmentId}</td>
                    <td style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--ink-soft)" }}>
                      {r.description}
                    </td>
                    <td><span className={"pill " + (r.status === "converted" ? "pill-ok" : r.status === "rejected" ? "pill-err" : "pill-warn")}>{r.status}</span></td>
                    <td>{r.quotedPriceBdt ? formatBdt(r.quotedPriceBdt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {reviewRows.length > 0 && (
        <>
          <h2 className="serif" style={{ fontSize: 22, color: "var(--purple-900)", fontWeight: 500, marginTop: 32, marginBottom: 12 }}>
            Reviews left
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {reviewRows.map((r) => (
              <article key={r.id} style={{ padding: 14, background: "white", border: "1px solid var(--line)", fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "var(--ink-soft)" }}>
                  <span>{r.productId} · <span className={"pill " + (r.status === "approved" ? "pill-ok" : r.status === "rejected" ? "pill-err" : "pill-warn")}>{r.status}</span></span>
                  <span>{formatDate(new Date(r.createdAt))}</span>
                </div>
                <div style={{ color: "var(--gold-deep)", marginBottom: 4 }}>
                  {"★★★★★".slice(0, r.rating)}<span style={{ color: "var(--line)" }}>{"★★★★★".slice(0, 5 - r.rating)}</span>
                </div>
                {r.title && <div style={{ fontWeight: 500, marginBottom: 4 }}>{r.title}</div>}
                {r.body && <div style={{ color: "var(--ink-soft)" }}>{r.body}</div>}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
