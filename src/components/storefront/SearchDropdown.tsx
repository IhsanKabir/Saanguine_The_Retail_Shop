"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { formatBdt } from "@/lib/utils";
import Composition from "./Composition";
import Icon from "./Icon";

type SearchHit = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  nameBn: string | null;
  priceBdt: number;
  cat: string | null;
};

export default function SearchDropdown() {
  const t = useTranslations();
  const locale = useLocale() as "en" | "bn";
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Click-outside to close.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounced fetch.
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const j = await r.json();
        setHits(j.results || []);
      } catch { setHits([]); }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const onPick = (slug: string) => {
    setOpen(false); setQ("");
    router.push({ pathname: "/product/[slug]", params: { slug } });
  };

  return (
    <div className="nav-search" ref={wrapRef}>
      <Icon name="search" size={16}/>
      <input
        type="search"
        aria-label={t("nav.search")}
        placeholder={t("nav.search")}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
      />
      {open && q.length >= 2 && (
        <div className="search-pop" role="listbox">
          {hits.length === 0 ? (
            <div className="search-empty">No correspondence found</div>
          ) : (
            hits.map((p) => (
              <div
                key={p.id}
                className="search-row"
                role="option"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(p.slug)}
              >
                <Composition cat={p.cat || "clothing"} sku={p.sku} name={p.name} small />
                <div>
                  <div className="ct">{p.cat || ""}</div>
                  <div className="nm">{(locale === "bn" && p.nameBn) || p.name}</div>
                </div>
                <div className="pr">{formatBdt(p.priceBdt, locale)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
