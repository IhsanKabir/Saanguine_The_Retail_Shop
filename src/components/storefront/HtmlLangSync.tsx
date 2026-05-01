"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

/**
 * Keeps <html lang="..."> in sync with the active locale.
 * Necessary because <html> lives in the root layout (lang="en" default),
 * while next-intl's locale is only known inside [locale]/layout.
 */
export default function HtmlLangSync() {
  const locale = useLocale();
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);
  return null;
}
