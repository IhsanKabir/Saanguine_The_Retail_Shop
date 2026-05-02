import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSegmentBySlug, getLiveProducts } from "@/lib/queries";
import { Link } from "@/i18n/routing";
import ProductCard from "@/components/storefront/ProductCard";

type Props = {
  params: Promise<{ locale: string; segment: string }>;
};

const CURSOR_BY_SEGMENT: Record<string, string> = {
  clothing: "magnify",
  accessories: "magnify",
  perfume: "perfume",
  jewelry: "jewelry",
  flowers: "flowers",
  watches: "watches",
  books: "inkwell",
};

export default async function SegmentPage({ params }: Props) {
  const { locale, segment } = await params;
  setRequestLocale(locale);

  const seg = await getSegmentBySlug(segment).catch(() => null);
  if (!seg || seg.hidden) notFound();

  // If both stock and pre-order are off, the segment is effectively closed.
  // Show a "soon" placeholder rather than 404 — useful while admin sets up.
  const showStock = seg.stockEnabled;
  const showPreorder = seg.preorderEnabled;

  const items = showStock
    ? await getLiveProducts({ segmentId: segment }).catch(() => [])
    : [];

  const name = (locale === "bn" && seg.nameBn) || seg.name;
  const tag = (locale === "bn" && seg.tagBn) || seg.tag || "";
  const blurb = (locale === "bn" && seg.blurbBn) || seg.blurb || "";

  const cursor = CURSOR_BY_SEGMENT[segment] || "crosshair";

  return (
    <>
      <div className="crumbs">
        <Link href="/" style={{ cursor: "pointer" }}>Maison</Link>
        <span>Boutique</span>
        <span className="current">{name}</span>
      </div>
      <section className="section" style={{ paddingTop: 28 }} data-cursor={cursor}>
        <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, letterSpacing: ".3em", color: "var(--gold-deep)", marginBottom: 8 }}>
            {tag.toUpperCase()}
          </div>
          <h1 className="serif" style={{ fontSize: 64, margin: 0, color: "var(--purple-900)", fontWeight: 400 }}>
            {name}
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "12px 0 0", maxWidth: 520 }}>
            {showStock && showPreorder
              ? `${blurb}. Browse below or compose a bespoke piece.`
              : showPreorder
              ? `${blurb}. Each piece is composed on request, then delivered.`
              : showStock
              ? `${blurb}. ${items.length} pieces in stock.`
              : `${blurb}.`}
          </p>
        </div>

        {/* In-stock product grid (only if stock toggle is on) */}
        {showStock && (
          items.length > 0 ? (
            <div className="grid grid-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} segmentTag={tag} />
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginBottom: showPreorder ? 24 : 0 }}>
              <h3>No pieces in stock just now</h3>
              {!showPreorder && <p style={{ color: "var(--ink-soft)" }}>Check back soon.</p>}
            </div>
          )
        )}

        {/* Bespoke pre-order CTA */}
        {showPreorder && (
          <div style={{
            marginTop: showStock ? 60 : 0,
            padding: 56,
            background: "var(--purple-950)",
            color: "var(--cream)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 32,
          }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".4em", color: "var(--gold)", marginBottom: 14 }}>
                BESPOKE · ON REQUEST
              </div>
              <h2 className="serif" style={{ fontSize: 40, margin: 0, color: "var(--cream)", fontWeight: 400, lineHeight: 1.1 }}>
                {showStock
                  ? <>Or have us <em style={{ color: "var(--gold)" }}>compose one</em> for you.</>
                  : <>Each piece is <em style={{ color: "var(--gold)" }}>composed on request</em>.</>}
              </h2>
              <p style={{ color: "var(--purple-200)", fontSize: 15, lineHeight: 1.7, margin: "16px 0 0", maxWidth: 540 }}>
                Send your references — images, films, the feeling you have in mind — and the maison will return a quote and timeline within a day or two. No payment is taken until delivery.
              </p>
            </div>
            <Link href={`/preorder/${segment}`} className="btn btn-gold" style={{ whiteSpace: "nowrap" }}>
              Compose a piece →
            </Link>
          </div>
        )}

        {/* Both off → segment placeholder */}
        {!showStock && !showPreorder && (
          <div className="empty-state">
            <h3>Coming soon</h3>
            <p style={{ color: "var(--ink-soft)" }}>This collection is being prepared.</p>
          </div>
        )}
      </section>
    </>
  );
}
