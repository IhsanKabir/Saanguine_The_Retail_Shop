import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Magic-link callback. Supabase appends `?code=...` to the redirect URL.
 * We exchange it for a session, then bounce to /account (default locale path).
 *
 * Open-redirect guard: `next` must be a same-origin relative path. We strictly
 * require it to start with a single `/` and reject anything that begins with
 * `//`, contains `://` (scheme injection), or `\` (Windows-style traversal
 * some validators miss). On reject we fall back to the safe default.
 */
function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("://")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/en/account");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth callback]", error.message);
      return NextResponse.redirect(`${origin}/en/sign-in?error=auth_failed`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
