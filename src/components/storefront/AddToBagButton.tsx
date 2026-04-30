"use client";

import { useState } from "react";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useLocale, useTranslations } from "next-intl";
import { formatBdt } from "@/lib/utils";
import Icon from "./Icon";

type Props = {
  product: Omit<CartItem, "qty" | "color" | "size">;
  colors?: string[];
  sizes?: string[];
};

export default function AddToBagButton({ product, colors = [], sizes = [] }: Props) {
  const t = useTranslations();
  const locale = useLocale() as "en" | "bn";
  const { add } = useCart();
  const [color, setColor] = useState<string>(colors[0] || "");
  const [size, setSize] = useState<string>(sizes[0] || "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add({ ...product, qty, color: color || null, size: size || null });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <>
      {colors.length > 0 && (
        <>
          <div className="pdp-label">Option — {color}</div>
          <div className="swatch-row">
            {colors.map((c) => (
              <div
                key={c}
                className={"swatch size-pill " + (c === color ? "active" : "")}
                role="button"
                tabIndex={0}
                onClick={() => setColor(c)}
                onKeyDown={(e) => { if (e.key === "Enter") setColor(c); }}
              >
                {c}
              </div>
            ))}
          </div>
        </>
      )}
      {sizes.length > 0 && (
        <>
          <div className="pdp-label">Size — {size}</div>
          <div className="swatch-row">
            {sizes.map((s) => (
              <div
                key={s}
                className={"swatch size-pill " + (s === size ? "active" : "")}
                role="button"
                tabIndex={0}
                onClick={() => setSize(s)}
                onKeyDown={(e) => { if (e.key === "Enter") setSize(s); }}
              >
                {s}
              </div>
            ))}
          </div>
        </>
      )}
      <div className="pdp-label">Quantity</div>
      <div className="qty">
        <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
        <span aria-live="polite">{qty}</span>
        <button onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
      </div>
      <div className="pdp-actions">
        <button className="btn btn-primary btn-block" onClick={onAdd}>
          <Icon name={added ? "check" : "bag"} size={14} />
          {added ? "Added" : `${t("pdp.addToBag")} · ${formatBdt(product.priceBdt * qty, locale)}`}
        </button>
      </div>
    </>
  );
}
