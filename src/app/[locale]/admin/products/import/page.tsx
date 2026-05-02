import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth-utils";
import ImportClient from "./ImportClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bulk product import",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string }> };

export default async function BulkImportPage({ params }: Props) {
  await requirePermission("products");
  const { locale } = await params;
  setRequestLocale(locale);
  return <ImportClient />;
}
