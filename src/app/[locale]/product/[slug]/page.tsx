import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getProductBySlug, getSegmentBySlug, getRelatedProducts, getProductImages } from "@/lib/queries";
import { trackEvent } from "@/lib/events";
import { Link } from "@/i18n/routing";
import { formatBdt } from "@/lib/utils";
import Icon from "@/components/storefront/Icon";
import ProductCard from "@/components/storefront/ProductCard";
import AddToBagButton from "@/components/storefront/AddToBagButton";
import PdpGallery from "@/components/storefront/PdpGallery";

type Props = { params: Promise<{ locale: string; slug: string }> };

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug).catch(() => null);
  if (!p) return { title: "Not found" };
  const isBn = locale === "bn";
  const name = (isBn && p.nameBn) || p.name;
  const description = (isBn && p.descriptionBn) || p.description || "A piece from the maison.";
  const url = `${BASE}/${locale}/product/${slug}`;
  return {
    title: name,
    description,
    alternates: {
      canonical: url,
      languages: {
        "en-BD": `${BASE}/en/product/${slug}`,
        "bn-BD": `${BASE}/bn/product/${slug}`,
      },
    },
    openGraph: { title: name, description, url, type: "website" },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug: slugForEvent } = await params;
  trackEvent({ type: "product_view", productId: slugForEvent, path: `/product/${slugForEvent}` }).catch(() => {});
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const p = await getProductBySlug(slug).catch(() => null);
  if (!p) notFound();
  const seg = p.segmentId ? await getSegmentBySlug(p.segmentId).catch(() => null) : null;
  const [related, photos] = await Promise.all([
    p.segmentId ? getRelatedProducts(p.id, p.segmentId).catch(() => []) : Promise.resolve([]),
    getProductImages(p.id).catch(() => []),
  ]);

  const isBn = locale === "bn";
  const name = (isBn && p.nameBn) || p.name;
  const description = (isBn && p.descriptionBn) || p.description || "";
  const segName = seg ? ((isBn && seg.nameBn) || seg.name) : "";
  const segTag = seg ? ((isBn && seg.tagBn) || seg.tag) : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: p.sku,
    description,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: p.priceBdt,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${BASE}/${locale}/product/${p.slug}`,
    },
    aggregateRating: p.reviewCount > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(p.rating),
      reviewCount: p.reviewCount,
    } : undefined,
    brand: { "@type": "Brand", name: "Saanguine" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="crumbs">
        <Link href="/">Maison</Link>
        {seg && (
          <Link href={`/shop/${seg.id}`}>
            {segName}
          </Link>
        )}
        <span className="current">{name}</span>
      </div>
      <section className="pdp" data-cursor="loupe">
        <PdpGallery
          photos={photos.map((ph) => ({ url: ph.url, alt: ph.alt }))}
          fallback={{
            cat: p.segmentId || "clothing",
            sku: p.sku,
            name: p.name,
            tag: p.tag,
          }}
        />
        <div className="pdp-info">
          <div className="collection">{(segTag || "").toUpperCase()} · {p.sku}</div>
          <h1>{name}</h1>
          <div className="pdp-rating">
            <span className="stars">{"★★★★★".slice(0, Math.round(Number(p.rating)))}{"☆☆☆☆☆".slice(0, 5 - Math.round(Number(p.rating)))}</span>
            <span>{Number(p.rating).toFixed(1)}</span>
            <span>·</span>
            <span>{p.reviewCount} {p.reviewCount === 1 ? t("pdp.review") : t("pdp.reviews")}</span>
          </div>
          <div className="pdp-price">
            <span className="now">{formatBdt(p.priceBdt, locale as "en" | "bn")}</span>
            {p.wasBdt && <span className="was">{formatBdt(p.wasBdt, locale as "en" | "bn")}</span>}
            {p.wasBdt && (
              <span className="save">
                Save {Math.round((1 - p.priceBdt / p.wasBdt) * 100)}%
              </span>
            )}
          </div>
          <div style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {description}
          </div>
          <AddToBagButton
            product={{
              productId: p.id,
              slug: p.slug,
              sku: p.sku,
              name,
              priceBdt: p.priceBdt,
              cat: p.segmentId || "clothing",
            }}
            colors={(p.colors as string[] | null) || []}
            sizes={(p.sizes as string[] | null) || []}
          />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
            {p.stock < 10 ? t("pdp.remaining", { count: p.stock }) : t("pdp.inStock")}
          </div>
          <div className="pdp-feats">
            <div className="pdp-feat"><Icon name="arrow" size={18} /><div><b>{t("pdp.freeShipping")}</b>{t("pdp.freeShippingNote")}</div></div>
            <div className="pdp-feat"><Icon name="check" size={18} /><div><b>{t("pdp.codTitle")}</b>{t("pdp.codNote")}</div></div>
            <div className="pdp-feat"><Icon name="check" size={18} /><div><b>{t("pdp.authentic")}</b>{t("pdp.authenticNote")}</div></div>
            <div className="pdp-feat"><Icon name="feather" size={18} /><div><b>{t("pdp.giftService")}</b>{t("pdp.giftServiceNote")}</div></div>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section">
          <div className="section-hd">
            <div>
              <div className="kicker">{t("pdp.alsoLike")}</div>
              <h2>{t("pdp.fromSameHouse")}</h2>
            </div>
          </div>
          <div className="grid grid-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} segmentTag={segTag} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
