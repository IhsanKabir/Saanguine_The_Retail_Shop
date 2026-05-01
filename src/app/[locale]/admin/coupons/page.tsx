import { requirePermission } from "@/lib/auth-utils";
import { listCoupons } from "@/lib/actions/coupons";
import CouponsClient from "./CouponsClient";

export default async function AdminCouponsPage() {
  await requirePermission("coupons");
  const coupons = await listCoupons();
  return <CouponsClient coupons={coupons} />;
}
