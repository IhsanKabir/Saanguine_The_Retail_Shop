"use client";

import { useState, useTransition } from "react";
import type { Order, OrderLine } from "@/lib/schema";
import { updateOrderStatus, bookCourier } from "@/lib/actions/admin";
import { formatBdt, formatDate } from "@/lib/utils";
import Icon from "@/components/storefront/Icon";

type Props = { orders: Order[]; lines: OrderLine[] };

const STATUSES = ["pending","cod_pending","paid","processing","shipped","delivered","cancelled","refunded"] as const;

export default function OrdersClient({ orders, lines }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [, startTransition] = useTransition();
  const [courier, setCourier] = useState<"pathao" | "steadfast">("pathao");
  const [pathaoCity, setPathaoCity] = useState("1");
  const [pathaoZone, setPathaoZone] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);

  const list = orders.filter((o) => filter === "all" || o.status === filter);
  const linesFor = (orderId: string) => lines.filter((l) => l.orderId === orderId);

  return (
    <>
      <h1 className="admin-h1">Orders</h1>
      <p className="admin-sub">{orders.length} total · {orders.filter((o) => o.status === "cod_pending").length} awaiting fulfilment.</p>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[
          { k: "All", v: orders.length, val: "all" },
          { k: "Awaiting", v: orders.filter((o) => o.status === "cod_pending" || o.status === "pending").length, val: "cod_pending" },
          { k: "Shipped",  v: orders.filter((o) => o.status === "shipped").length, val: "shipped" },
          { k: "Delivered",v: orders.filter((o) => o.status === "delivered").length, val: "delivered" },
          { k: "Cancelled",v: orders.filter((o) => o.status === "cancelled").length, val: "cancelled" },
        ].map((s) => (
          <div key={s.k} className="stat" onClick={() => setFilter(s.val)} style={{ cursor: "pointer" }}>
            <div className="k">{s.k}</div><div className="v">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="table">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Courier</th><th>Date</th></tr></thead>
          <tbody>
            {list.map((o) => {
              const addr = o.shippingAddress as { fullName: string; phone: string };
              const itemCount = linesFor(o.id).reduce((s, l) => s + l.qty, 0);
              return (
                <tr key={o.id} onClick={() => setSelected(o)} style={{ cursor: "pointer" }}>
                  <td style={{ fontFamily: "var(--mono)", color: "var(--purple-900)", fontWeight: 500 }}>{o.number}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{addr.fullName}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{o.guestEmail}</div>
                  </td>
                  <td>{itemCount}</td>
                  <td style={{ fontWeight: 500 }}>{formatBdt(o.totalBdt)}</td>
                  <td>
                    <span className={"pill " + (o.status === "delivered" ? "pill-ok" : o.status === "shipped" ? "pill-info" : o.status === "cancelled" ? "pill-err" : "pill-warn")}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {o.shippingCourier ? `${o.shippingCourier} · ${o.shippingTracking}` : "—"}
                  </td>
                  <td style={{ color: "var(--ink-soft)", fontSize: 12 }}>{formatDate(o.createdAt!)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)}/>
          <div className="drawer" style={{ width: 520 }}>
            <div className="drawer-hd">
              <div>
                <h3>{selected.number}</h3>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Placed {formatDate(selected.createdAt!)}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}><Icon name="x"/></button>
            </div>
            <div className="drawer-body" style={{ padding: "20px 24px" }}>
              <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
                <div className="pdp-label">Customer</div>
                {(() => {
                  const a = selected.shippingAddress as { fullName: string; phone: string; line1: string; area?: string; city: string; postcode?: string };
                  return (
                    <>
                      <div style={{ fontWeight: 500 }}>{a.fullName}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                        {selected.guestEmail}<br/>{a.phone}<br/>
                        {a.line1}<br/>{a.area ? a.area + ", " : ""}{a.city}{a.postcode ? " — " + a.postcode : ""}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
                <div className="pdp-label">Items</div>
                {linesFor(selected.id).map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
                    <span>{l.nameSnapshot} <span style={{ color: "var(--ink-soft)" }}>× {l.qty}</span></span>
                    <span>{formatBdt(l.lineTotalBdt)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, fontWeight: 500 }}>
                  <span>Total</span><span>{formatBdt(selected.totalBdt)}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
                <div className="pdp-label">Status</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STATUSES.map((st) => (
                    <button key={st} className={"filter-pill " + (selected.status === st ? "active" : "")}
                      onClick={() => startTransition(async () => {
                        await updateOrderStatus(selected.id, st);
                        setSelected({ ...selected, status: st });
                      })}
                      style={{ padding: "5px 10px", fontSize: 11 }}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {selected.shippingCourier ? (
                <div className="panel" style={{ padding: 16, background: "var(--purple-50)" }}>
                  <div className="pdp-label">Courier</div>
                  <div style={{ fontSize: 13 }}><b>{selected.shippingCourier}</b> · {selected.shippingTracking}</div>
                </div>
              ) : (
                <div className="panel" style={{ padding: 16, background: "var(--purple-50)" }}>
                  <div className="pdp-label">Book courier</div>
                  <div className="row">
                    <div className="field">
                      <label>Courier</label>
                      <select value={courier} onChange={(e) => setCourier(e.target.value as "pathao" | "steadfast")}>
                        <option value="pathao">Pathao</option>
                        <option value="steadfast">Steadfast</option>
                      </select>
                    </div>
                  </div>
                  {courier === "pathao" && (
                    <div className="row">
                      <div className="field"><label>Pathao city ID</label><input type="number" value={pathaoCity} onChange={(e) => setPathaoCity(e.target.value)}/></div>
                      <div className="field"><label>Pathao zone ID</label><input type="number" value={pathaoZone} onChange={(e) => setPathaoZone(e.target.value)}/></div>
                    </div>
                  )}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }}
                    onClick={() => {
                      setBookError(null);
                      startTransition(async () => {
                        const r = await bookCourier({
                          orderId: selected.id,
                          courier,
                          ...(courier === "pathao" && {
                            pathaoCity: parseInt(pathaoCity) || 1,
                            pathaoZone: parseInt(pathaoZone) || 1,
                          }),
                        });
                        if (!r.ok) setBookError(r.error);
                      });
                    }}>
                    Book {courier}
                  </button>
                  {bookError && <p style={{ color: "var(--err)", fontSize: 12, marginTop: 8 }}>{bookError}</p>}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
