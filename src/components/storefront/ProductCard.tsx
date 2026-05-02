import type { Product } from "@/lib/schema";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import Image from "next/image";
import { formatBdt } from "@/lib/utils";
import Composition from "./Composition";
import WishHeart from "./WishHeart";

type Props = {
  product: Product;
  segmentTag?: string | null;
  /** Optional hero image (real photograph) — falls back to Composition art if omitted. */
  heroImage?: { url: string; alt: string | null } | null;
};

export default function ProductCard({ product: p, segmentTag, heroImage }: Props) {
  const locale = useLocale() as "en" | "bn";
  const name = (locale === "bn" && p.nameBn) || p.name;

  return (
    <article className="card">
      <Link href={`/product/${p.slug}`}>
        <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden" }}>
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt ?? name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <Composition
              cat={p.segmentId || "clothing"}
              sku={p.sku}
              name={p.name}
              tag={p.tag}
              ribbon={p.tag === "new" ? "New" : null}
              sale={p.tag === "sale"}
              style={{ aspectRatio: "3/4" }}
            />
          )}
          <WishHeart productId={p.id} />
        </div>
        <div className="prod-body">
          {segmentTag && <div className="prod-meta">{segmentTag}</div>}
          <h3 className="prod-name">{name}</h3>
          <div className="prod-price">
            {p.wasBdt ? <span className="strike">{formatBdt(p.wasBdt, locale)}</span> : null}
            {formatBdt(p.priceBdt, locale)}
          </div>
        </div>
      </Link>
    </article>
  );
}
