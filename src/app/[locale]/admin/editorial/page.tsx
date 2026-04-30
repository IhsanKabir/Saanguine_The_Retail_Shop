import { getBrand } from "@/lib/actions/admin";
import EditorialClient from "./EditorialClient";

export default async function AdminEditorialPage() {
  const brand = await getBrand();
  return (
    <EditorialClient initial={brand || {
      name: "Saanguine",
      tagline: "Garments, flora & small ceremonies",
      email: "concierge@saanguine.com",
      announcement: "Complimentary shipping over ৳3,000 · Cash on Delivery available nationwide",
    }} />
  );
}
