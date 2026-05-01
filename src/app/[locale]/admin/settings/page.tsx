import { getBrand } from "@/lib/actions/admin";
import SettingsClient from "./SettingsClient";
import { requirePermission } from "@/lib/auth-utils";

export default async function AdminSettingsPage() {
  await requirePermission("settings");
  const brand = await getBrand();
  return (
    <SettingsClient initialBrand={brand || {
      name: "Saanguine",
      tagline: "Garments, flora & small ceremonies",
      email: "concierge@saanguine.com",
      announcement: "Complimentary shipping over ৳3,000 · Cash on Delivery available nationwide",
    }} />
  );
}
