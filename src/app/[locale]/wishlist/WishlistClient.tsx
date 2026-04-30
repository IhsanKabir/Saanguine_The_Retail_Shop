"use client";

import { useWishlist } from "@/lib/wishlist-context";
import type { Product, Segment } from "@/lib/schema";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/storefront/ProductCard";
import Icon from "@/components/storefront/Icon";

export default function WishlistClient({ products, segments }: { products: Product[]; segments: Segment[] }) {
  const t = useTranslations();
  const { items, hydrated } = useWishlist();
  if (!hydrated) return <p>Loading…</p>;

  const list = products.filter((p) => items.has(p.id));
  return (
    <>
      <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", color: "var(--gold-deep)", marginBottom: 8 }}>
          {t("wishlist.saved").toUpperCase()}
        </div>
        <h1 className="serif" style={{ fontSize: 64, margin: 0, color: "var(--purple-900)", fontWeight: 400 }}>
          {t("wishlist.title")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "12px 0 0" }}>
          {list.length === 0 ? t("wishlist.empty") : t("wishlist.count", { count: list.length })}
        </p>
      </div>
      {list.length === 0 ? (
        <div className="empty-state">
          <Icon name="heart" size={36} />
          <h3>{t("wishlist.emptyHeading")}</h3>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 14 }}>
            {t("wishlist.wander")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-4">
          {list.map((p) => {
            const seg = segments.find((s) => s.id === p.segmentId);
            return <ProductCard key={p.id} product={p} segmentTag={seg?.tag} />;
          })}
        </div>
      )}
    </>
  );
}
