"use client";

import { useCart } from "@/lib/cart-context";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { formatBdt } from "@/lib/utils";
import Composition from "./Composition";
import Icon from "./Icon";

const FREE_THRESHOLD = 3000;

export default function CartDrawer() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "bn";
  const router = useRouter();
  const { items, open, closeDrawer, inc, dec, remove, subtotalBdt, itemKey } = useCart();
  if (!open) return null;

  const remaining = Math.max(0, FREE_THRESHOLD - subtotalBdt);
  const met = remaining === 0;
  const pct = Math.min(100, Math.round((subtotalBdt / FREE_THRESHOLD) * 100));

  const onCheckout = () => { closeDrawer(); router.push("/checkout"); };

  return (
    <>
      <div className="overlay" onClick={closeDrawer} />
      <aside className="drawer" role="dialog" aria-label={t("cart.title")}>
        <div className="drawer-hd">
          <h3>{t("cart.title")} · {items.length}</h3>
          <button className="icon-btn" onClick={closeDrawer} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <Icon name="bag" size={36} />
              <h3>{t("cart.empty")}</h3>
              <p>{t("cart.emptySub")}</p>
            </div>
          ) : (
            <>
              <div className={"ship-bar " + (met ? "met" : "")}>
                <div className="top">
                  <span>
                    {met
                      ? "Complimentary delivery — unlocked"
                      : `${formatBdt(remaining, locale)} to free delivery`}
                  </span>
                  <b>{formatBdt(subtotalBdt, locale)} / {formatBdt(FREE_THRESHOLD, locale)}</b>
                </div>
                <div className="track"><div className="fill" style={{ ["--p" as string]: pct + "%" }} /></div>
              </div>

              {items.map((i) => {
                const k = itemKey(i);
                return (
                  <div key={k} className="cart-line">
                    <Composition cat={i.cat} sku={i.sku} name={i.name} small style={{ aspectRatio: "3/4" }} />
                    <div>
                      <Link href={`/product/${i.slug}`} className="name" onClick={closeDrawer}>
                        {i.name}
                      </Link>
                      <div className="meta">{i.color || ""}{i.size ? ` · ${i.size}` : ""}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                        <div className="qty" style={{ transform: "scale(.85)", transformOrigin: "left" }}>
                          <button onClick={() => dec(k)} aria-label="Decrease">−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => inc(k)} aria-label="Increase">+</button>
                        </div>
                      </div>
                      <div className="rm" onClick={() => remove(k)} role="button" tabIndex={0}>{t("cart.remove")}</div>
                    </div>
                    <div className="price">{formatBdt(i.priceBdt * i.qty, locale)}</div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="totals" style={{ marginBottom: 16 }}>
              <div className="r">
                <span>{t("cart.subtotal")}</span>
                <span>{formatBdt(subtotalBdt, locale)}</span>
              </div>
              <div className="r">
                <span>{t("cart.shipping")}</span>
                <span>{met ? t("cart.shippingFree") : "calculated at checkout"}</span>
              </div>
              <div className="r grand">
                <span>{t("cart.total")}</span>
                <span>{formatBdt(subtotalBdt, locale)}</span>
              </div>
            </div>
            <button className="btn btn-primary btn-block" onClick={onCheckout}>
              {t("cart.checkout")} <Icon name="arrow" size={14} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
