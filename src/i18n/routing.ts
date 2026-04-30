import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  // 'always' makes the locale prefix mandatory (e.g. /en/shop, /bn/shop).
  // 'as-needed' would let / serve the default. We pick 'always' for clarity.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
