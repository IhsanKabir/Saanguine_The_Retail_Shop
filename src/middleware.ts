import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match everything except static files, API routes, and _next.
  matcher: ["/", "/(en|bn)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
