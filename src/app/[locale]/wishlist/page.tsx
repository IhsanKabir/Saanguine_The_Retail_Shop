import { setRequestLocale } from "next-intl/server";
import { db, schema } from "@/lib/db";
import WishlistClient from "./WishlistClient";

type Props = { params: Promise<{ locale: string }> };

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [products, segments] = await Promise.all([
    db.select().from(schema.products).catch(() => []),
    db.select().from(schema.segments).catch(() => []),
  ]);
  return (
    <section className="section" style={{ paddingTop: 28 }}>
      <WishlistClient products={products} segments={segments} />
    </section>
  );
}
