import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Locale-prefixed magic-link callback. Mirrors /auth/callback so emails
 * sent before middleware exclusion was added still work.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || `/${locale}/account`;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth callback]", error);
      return NextResponse.redirect(
        `${origin}/${locale}/sign-in?error=${encodeURIComponent(error.message)}`,
      );
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
