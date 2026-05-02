import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Locale-prefixed magic-link callback. Mirrors /auth/callback so emails
 * sent before middleware exclusion was added still work.
 *
 * Same open-redirect guard as the root callback: `next` must be a same-origin
 * relative path with no `//`, `://`, or `\` injection patterns.
 */
function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("://")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), `/${locale}/account`);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth callback]", error.message);
      return NextResponse.redirect(`${origin}/${locale}/sign-in?error=auth_failed`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
