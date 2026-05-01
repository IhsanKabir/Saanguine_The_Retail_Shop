import { requirePermission } from "@/lib/auth-utils";
import { getSalesData, getCodReconciliation } from "@/lib/actions/reports";
import ReportsClient from "./ReportsClient";

type Preset = "7d" | "30d" | "mtd" | "qtd" | "ytd";

function rangeFor(preset: Preset, from?: string, to?: string): { from: Date; to: Date; preset: Preset } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (from && to) {
    return { from: new Date(from), to: new Date(to), preset };
  }
  switch (preset) {
    case "7d":  return { from: new Date(today.getTime() - 7 * 86400_000),  to: today, preset };
    case "30d": return { from: new Date(today.getTime() - 30 * 86400_000), to: today, preset };
    case "mtd": return { from: new Date(now.getFullYear(), now.getMonth(), 1),       to: today, preset };
    case "qtd": return { from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), to: today, preset };
    case "ytd": return { from: new Date(now.getFullYear(), 0, 1),                    to: today, preset };
  }
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: Preset; from?: string; to?: string }>;
}) {
  await requirePermission("reports");
  const sp = await searchParams;
  const preset: Preset = sp.preset ?? "30d";
  const range = rangeFor(preset, sp.from, sp.to);
  const [sales, cod] = await Promise.all([
    getSalesData({ from: range.from, to: range.to }),
    getCodReconciliation({ from: range.from, to: range.to }),
  ]);
  return (
    <ReportsClient
      initialPreset={preset}
      initialFrom={iso(range.from)}
      initialTo={iso(range.to)}
      sales={sales}
      cod={cod}
    />
  );
}
