import { setRequestLocale } from "next-intl/server";
import { listReviewsForModeration } from "@/lib/actions/reviews";
import ReviewsModerationClient from "./ReviewsModerationClient";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> };

export default async function AdminReviewsPage({ params, searchParams }: Props) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const status = (sp.status === "approved" || sp.status === "rejected") ? sp.status : "pending";
  const [pending, approved, rejected] = await Promise.all([
    listReviewsForModeration({ status: "pending" }),
    listReviewsForModeration({ status: "approved" }),
    listReviewsForModeration({ status: "rejected" }),
  ]);
  const counts = { pending: pending.reviews.length, approved: approved.reviews.length, rejected: rejected.reviews.length };
  const visible = status === "approved" ? approved : status === "rejected" ? rejected : pending;
  return <ReviewsModerationClient status={status} counts={counts} reviews={visible.reviews} productNames={Object.fromEntries(visible.productNames)} />;
}
