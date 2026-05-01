import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match everything except static files, API routes, _next, and /auth (for Supabase callback).
  matcher: ["/", "/(en|bn)/:path*", "/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
