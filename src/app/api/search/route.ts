import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await searchProducts(q, 8);
    return NextResponse.json({
      results: results.map((p) => ({
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        nameBn: p.nameBn,
        priceBdt: p.priceBdt,
        cat: p.segmentId,
      })),
    });
  } catch (e) {
    return NextResponse.json({ results: [], error: e instanceof Error ? e.message : String(e) });
  }
}
