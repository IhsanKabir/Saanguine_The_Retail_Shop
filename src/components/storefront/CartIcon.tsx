"use client";

import { useCart } from "@/lib/cart-context";
import Icon from "./Icon";

export default function CartIcon({ ariaLabel }: { ariaLabel: string }) {
  const { count, openDrawer } = useCart();
  return (
    <button className="icon-btn" aria-label={ariaLabel} onClick={openDrawer}>
      <Icon name="bag" />
      {count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
