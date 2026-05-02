import { setRequestLocale } from "next-intl/server";
import { listPreorderRequests } from "@/lib/actions/preorders";
import { db, schema } from "@/lib/db";
import PreordersClient from "./PreordersClient";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminPreordersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [requests, segments] = await Promise.all([
    listPreorderRequests(),
    db.select().from(schema.segments),
  ]);
  return <PreordersClient requests={requests} segments={segments} />;
}
