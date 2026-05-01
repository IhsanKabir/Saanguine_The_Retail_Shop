"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) { setError(error.message); return; }
    router.push("/account");
    router.refresh();
  };

  return (
    <section className="section" style={{ maxWidth: 420, padding: "100px 32px" }}>
      <div style={{ fontSize: 11, letterSpacing: ".4em", color: "var(--gold-deep)", marginBottom: 8, textAlign: "center" }}>WELCOME</div>
      <h1 className="serif" style={{ fontSize: 48, margin: "0 0 8px", color: "var(--purple-900)", fontWeight: 400, textAlign: "center" }}>
        {t("account.signIn")}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 32px", textAlign: "center" }}>
        Sign in with your email and password.
      </p>

      <form className="panel" onSubmit={onSubmit}>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.co"
            autoComplete="email"
            autoFocus
          />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            minLength={6}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        {error && <p style={{ color: "var(--err)", fontSize: 13, marginTop: 12 }}>{error}</p>}
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 18, textAlign: "center" }}>
          Or simply <Link href="/checkout">place an order as a guest</Link>.
        </p>
      </form>
    </section>
  );
}
