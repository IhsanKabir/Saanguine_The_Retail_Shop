"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

const KEY = "ssg-cookie-consent-v1";

type Choice = { choice: "accept" | "decline"; at: number };

/**
 * Returns the user's consent choice, or null if they have not yet decided.
 * Other components (e.g. SessionTracker) gate analytics on this.
 */
export function readConsent(): Choice | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Choice;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const locale = useLocale();
  const isBn = locale === "bn";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch { /* private mode */ }
  }, []);

  const persist = (choice: "accept" | "decline") => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() } satisfies Choice));
      // Notify other tabs / listeners (e.g. SessionTracker)
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-label={isBn ? "কুকি পছন্দ" : "Cookie preferences"}>
      <div className="cb-text">
        {isBn ? (
          <>
            <b>কুকি সম্পর্কে ছোট একটি কথা।</b>{" "}
            আমরা আপনার ব্যাগ মনে রাখতে একটি সেশন কুকি এবং কোন পিসগুলো বেশি যত্নে দেখা হচ্ছে তা বুঝতে একটি ছোট অ্যানালিটিক্স কুকি ব্যবহার করি। কোনো ট্র্যাকিং পিক্সেল নেই, কোনো বিজ্ঞাপন নেই। আমাদের <Link href="/legal/privacy">গোপনীয়তা নীতি</Link> পড়ে নিন।
          </>
        ) : (
          <>
            <b>A small note on cookies.</b>{" "}
            We use a session cookie to keep your bag and a tiny analytics cookie to understand which pieces are most cared for. No tracking pixels, no ads. Read our <Link href="/legal/privacy">privacy policy</Link>.
          </>
        )}
      </div>
      <div className="cb-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => persist("decline")}>
          {isBn ? "কেবল প্রয়োজনীয়" : "Essential only"}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => persist("accept")}>
          {isBn ? "সব গ্রহণ" : "Accept all"}
        </button>
      </div>
    </div>
  );
}
