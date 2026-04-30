import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { getVisibleSegments, getLiveProducts } from "@/lib/queries";
import Composition from "@/components/storefront/Composition";
import ProductCard from "@/components/storefront/ProductCard";
import Icon from "@/components/storefront/Icon";

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // Fetch in parallel; degrade gracefully if DB isn't configured yet.
  const [segments, newArrivals, editors] = await Promise.all([
    safeQuery(getVisibleSegments()),
    safeQuery(getLiveProducts({ tag: "new", limit: 4 })),
    safeQuery(getLiveProducts({ limit: 6 })),
  ]);

  const showSetupBanner = segments === null;
  const segs = segments ?? [];
  const news = newArrivals ?? [];
  const eds = editors ?? [];

  return (
    <>
      {showSetupBanner && (
        <div style={{ background: "#fff8d4", borderBottom: "1px solid #c8a200", padding: "10px 20px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 12, color: "#704d00" }}>
          ⚠ Database not configured · copy <code>.env.example</code> → <code>.env</code>, fill Supabase URL + DATABASE_URL, run <code>npm run db:migrate</code> + <code>npm run db:seed</code>.
        </div>
      )}

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-kicker">{t("home.kicker")}</div>
            <h1>
              {t("home.headlineLineOne")}<br />
              {t("home.headlineLineTwoStart")}<em>{t("home.headlineLineTwoEm")}</em><br />
              {t("home.headlineLineThree")}
            </h1>
            <p>{t("home.lede")}</p>
            <div style={{ display: "flex", gap: 12 }}>
              {segs[0] && (
                <Link
                  href={{ pathname: "/shop/[segment]", params: { segment: segs[0].id } }}
                  className="btn btn-gold"
                >
                  {t("home.ctaPrimary")} <Icon name="arrow" size={14} />
                </Link>
              )}
              {segs.find((c) => c.id === "perfume") && (
                <Link
                  href={{ pathname: "/shop/[segment]", params: { segment: "perfume" } }}
                  className="btn btn-ghost"
                  style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                >
                  {t("home.ctaSecondary")}
                </Link>
              )}
            </div>
          </div>
          <div className="hero-still" aria-hidden="true">
            <div className="hs-frame" />
            <div className="hs-ring" />
            <div className="hs-numeral">MMXXVI</div>
            <div className="hs-rail">
              <span>{t("brand.name")}</span><span>·</span><span>Atelier</span>
            </div>
            <div className="hs-cap">
              The slow unspooling of a season.<small>Genesis · Chapter I</small>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee ──────────────────────────────────────────────── */}
      <div className="marquee">
        <div className="marquee-track">
          <span>Hand-finished</span><span>Wax-sealed</span><span>Cash on Delivery</span>
          <span>White-glove courier</span><span>30-day returns</span><span>Atelier-made</span>
          <span>Hand-finished</span><span>Wax-sealed</span><span>Cash on Delivery</span>
          <span>White-glove courier</span><span>30-day returns</span><span>Atelier-made</span>
        </div>
      </div>

      {/* ─── Segments grid ───────────────────────────────────────── */}
      {segs.length > 0 && (
        <section className="section">
          <div className="section-hd">
            <div>
              <div className="kicker">{t("home.departments")}</div>
              <h2>{t("home.wanderTheHouse")}</h2>
              <div className="ornament-rule" />
            </div>
          </div>
          <div className="cat-grid">
            {segs.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={{ pathname: "/shop/[segment]", params: { segment: c.id } }}
                className="cat-tile"
              >
                <Composition cat={c.id} sku={c.id} name={c.name} style={{ position: "absolute", inset: 0 }} />
                <div className="cat-tile-lbl">
                  <div className="kicker">{c.tag}</div>
                  <div className="name">{c.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── New arrivals ─────────────────────────────────────────── */}
      {news.length > 0 && (
        <section className="section" style={{ paddingTop: 20 }}>
          <div className="section-hd">
            <div>
              <div className="kicker">{t("home.justArrived")}</div>
              <h2>{t("home.newThisWeek")}</h2>
              <div className="ornament-rule" />
            </div>
            {segs[0] && (
              <Link
                href={{ pathname: "/shop/[segment]", params: { segment: segs[0].id } }}
                className="link"
              >
                {t("home.viewAll")} →
              </Link>
            )}
          </div>
          <div className="grid grid-4">
            {news.map((p) => {
              const seg = segs.find((s) => s.id === p.segmentId);
              return <ProductCard key={p.id} product={p} segmentTag={seg?.tag} />;
            })}
          </div>
        </section>
      )}

      {/* ─── Editor's selection ───────────────────────────────────── */}
      {eds.length > 0 && (
        <section className="section">
          <div className="section-hd">
            <div>
              <div className="kicker">{t("home.editors")}</div>
              <h2>{t("home.favourites")}</h2>
              <div className="ornament-rule" />
            </div>
          </div>
          <div className="grid grid-3">
            {eds.slice(0, 6).map((p) => {
              const seg = segs.find((s) => s.id === p.segmentId);
              return <ProductCard key={p.id} product={p} segmentTag={seg?.tag} />;
            })}
          </div>
        </section>
      )}
    </>
  );
}

/** Returns the resolved value or null on any error. Lets the page render
 *  before the database is configured. */
async function safeQuery<T>(p: Promise<T>): Promise<T | null> {
  try { return await p; } catch { return null; }
}
