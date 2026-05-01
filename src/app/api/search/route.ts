import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/queries";
import { trackEvent } from "@/lib/events";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await searchProducts(q, 8);
    // Fire-and-forget event with zero-result flag for "search insights" report
    trackEvent({
      type: "search",
      payload: { query: q, results: results.length, zero_result: results.length === 0 },
      path: "/api/search",
    }).catch(() => {});
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
