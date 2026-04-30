import type { Product } from "@/lib/schema";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { formatBdt } from "@/lib/utils";
import Composition from "./Composition";
import WishHeart from "./WishHeart";

type Props = {
  product: Product;
  segmentTag?: string | null;
};

export default function ProductCard({ product: p, segmentTag }: Props) {
  const locale = useLocale() as "en" | "bn";
  const name = (locale === "bn" && p.nameBn) || p.name;

  return (
    <article className="card">
      <Link href={{ pathname: "/product/[slug]", params: { slug: p.slug } }}>
        <div style={{ position: "relative" }}>
          <Composition
            cat={p.segmentId || "clothing"}
            sku={p.sku}
            name={p.name}
            tag={p.tag}
            ribbon={p.tag === "new" ? "New" : null}
            sale={p.tag === "sale"}
            style={{ aspectRatio: "3/4" }}
          />
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
