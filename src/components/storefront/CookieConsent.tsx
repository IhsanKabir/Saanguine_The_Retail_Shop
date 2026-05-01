"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

const KEY = "ssg-cookie-consent-v1";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch { /* private mode */ }
  }, []);

  const accept = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: "accept", at: Date.now() })); } catch {}
    setVisible(false);
  };
  const decline = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: "decline", at: Date.now() })); } catch {}
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie preferences">
      <div className="cb-text">
        <b>A small note on cookies.</b>{" "}
        We use a session cookie to keep your bag and a tiny analytics cookie to understand which pieces are most cared for. No tracking pixels, no ads. Read our <Link href="/legal/privacy">privacy policy</Link>.
      </div>
      <div className="cb-actions">
        <button className="btn btn-ghost btn-sm" onClick={decline}>Essential only</button>
        <button className="btn btn-primary btn-sm" onClick={accept}>Accept all</button>
      </div>
    </div>
  );
}
