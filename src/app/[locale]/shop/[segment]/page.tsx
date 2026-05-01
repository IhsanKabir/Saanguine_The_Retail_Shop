import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSegmentBySlug, getLiveProducts } from "@/lib/queries";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/storefront/ProductCard";

type Props = {
  params: Promise<{ locale: string; segment: string }>;
};

export default async function SegmentPage({ params }: Props) {
  const { locale, segment } = await params;
  setRequestLocale(locale);

  const seg = await getSegmentBySlug(segment).catch(() => null);
  if (!seg || seg.hidden) notFound();
  const items = await getLiveProducts({ segmentId: segment }).catch(() => []);

  const name = (locale === "bn" && seg.nameBn) || seg.name;
  const tag = (locale === "bn" && seg.tagBn) || seg.tag || "";
  const blurb = (locale === "bn" && seg.blurbBn) || seg.blurb || "";

  return (
    <>
      <div className="crumbs">
        <Link href="/" style={{ cursor: "pointer" }}>Maison</Link>
        <span>Boutique</span>
        <span className="current">{name}</span>
      </div>
      <section className="section" style={{ paddingTop: 28 }} data-cursor={(({ clothing: "magnify", accessories: "magnify", perfume: "perfume", jewelry: "jewelry", flowers: "flowers", watches: "watches", books: "inkwell" } as Record<string, string>)[segment] || "crosshair")}>
        <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".3em", color: "var(--gold-deep)", marginBottom: 8 }}>
            {tag.toUpperCase()}
          </div>
          <h1 className="serif" style={{ fontSize: 64, margin: 0, color: "var(--purple-900)", fontWeight: 400 }}>
            {name}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "12px 0 0", maxWidth: 520 }}>
            {blurb}. {items.length} pieces in stock.
          </p>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} segmentTag={tag} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No pieces in this segment yet</h3>
          </div>
        )}
      </section>
    </>
  );
}
