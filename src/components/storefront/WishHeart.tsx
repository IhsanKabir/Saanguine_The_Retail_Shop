"use client";

import { useWishlist } from "@/lib/wishlist-context";
import Icon from "./Icon";

export default function WishHeart({ productId, className }: { productId: string; className?: string }) {
  const { has, toggle, hydrated } = useWishlist();
  if (!hydrated) return null;
  const on = has(productId);
  return (
    <button
      className={"heart-tick " + (on ? "on " : "") + (className || "")}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(productId); }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Icon name="heart" size={14} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
