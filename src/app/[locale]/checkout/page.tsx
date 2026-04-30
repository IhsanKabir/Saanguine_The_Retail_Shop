import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import CheckoutForm from "./CheckoutForm";

type Props = { params: Promise<{ locale: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <div className="section" style={{ maxWidth: 1200 }}>
      <div className="crumbs" style={{ padding: "0 0 24px", maxWidth: "none" }}>
        <Link href="/">Maison</Link>
        <span className="current">{t("checkout.title")}</span>
      </div>
      <h1 className="serif" style={{ fontSize: 44, margin: "0 0 28px", color: "var(--purple-900)", fontWeight: 400 }}>
        {t("checkout.title")}
      </h1>
      <CheckoutForm />
    </div>
  );
}
