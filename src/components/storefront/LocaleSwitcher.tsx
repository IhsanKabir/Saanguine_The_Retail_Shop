"use client";

import { useTransition } from "react";
import { useRouter, usePathname, routing, type Locale } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="locale-switch" role="group" aria-label="Language">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchTo(loc)}
          aria-pressed={current === loc}
          disabled={isPending || current === loc}
          className={current === loc ? "is-active" : ""}
        >
          {loc === "en" ? "EN" : "বাংলা"}
        </button>
      ))}
    </div>
  );
}
