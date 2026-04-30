"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setPending(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <section className="section" style={{ maxWidth: 420, padding: "100px 32px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".4em", color: "var(--gold-deep)", marginBottom: 8, textAlign: "center" }}>WELCOME</div>
      <h1 className="serif" style={{ fontSize: 48, margin: "0 0 8px", color: "var(--purple-900)", fontWeight: 400, textAlign: "center" }}>
        {t("account.signIn")}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 32px", textAlign: "center" }}>
        We will send a single-use link to your inbox.
      </p>

      {sent ? (
        <div className="panel" style={{ textAlign: "center" }}>
          <h3>Check your inbox</h3>
          <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
            The link arrives within a minute. It expires in one hour.
          </p>
        </div>
      ) : (
        <form className="panel" onSubmit={onSubmit}>
          <div className="field">
            <label>{t("checkout.email")}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.co" autoFocus/>
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={pending}>
            {pending ? "Sending…" : "Send sign-in link"}
          </button>
          {error && <p style={{ color: "var(--err)", fontSize: 13, marginTop: 12 }}>{error}</p>}
          <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18, textAlign: "center" }}>
            Or simply <Link href="/checkout">place an order as a guest</Link>.
          </p>
        </form>
      )}
    </section>
  );
}
