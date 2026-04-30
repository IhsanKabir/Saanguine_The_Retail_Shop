"use client";

import { useState, useTransition } from "react";
import { updateBrand } from "@/lib/actions/admin";
import Icon from "@/components/storefront/Icon";

type Brand = { name: string; tagline?: string; email?: string; announcement?: string };

export default function EditorialClient({ initial }: { initial: Brand }) {
  const [b, setB] = useState<Brand>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    startTransition(async () => {
      const res = await updateBrand({
        name: b.name,
        tagline: b.tagline || undefined,
        email: b.email || undefined,
        announcement: b.announcement || undefined,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  return (
    <>
      <h1 className="admin-h1">Editorial</h1>
      <p className="admin-sub">House voice. Reflected in nav, footer, announcement bar.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        <div className="panel">
          <h3>House details</h3>
          <div className="field"><label>Brand name</label><input value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })}/></div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Tagline</label>
            <input value={b.tagline || ""} onChange={(e) => setB({ ...b, tagline: e.target.value })}/>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Contact email</label>
            <input value={b.email || ""} onChange={(e) => setB({ ...b, email: e.target.value })}/>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Announcement bar</label>
            <input value={b.announcement || ""} onChange={(e) => setB({ ...b, announcement: e.target.value })}/>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18 }}>
            <button className="btn btn-primary btn-sm" onClick={onSave} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <span className={"saved-ind " + (saved ? "in" : "")} role="status" aria-live="polite">
              {saved && <><Icon name="check" size={12}/> Saved</>}
            </span>
          </div>
        </div>
        <div className="panel" style={{ background: "var(--purple-50)" }}>
          <h3>Live preview</h3>
          <div style={{ background: "var(--purple-950)", color: "var(--cream)", padding: "10px 16px", fontSize: 12, letterSpacing: ".15em", textTransform: "uppercase" }}>
            {b.announcement || "—"}
          </div>
          <div style={{ background: "white", padding: "20px 16px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontStyle: "italic", color: "var(--purple-900)" }}>{b.name}</span>
          </div>
          <div style={{ padding: "30px 16px", background: "var(--cream)" }}>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--purple-900)", fontSize: 16 }}>{b.tagline}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 12 }}>Contact: {b.email}</div>
          </div>
        </div>
      </div>
    </>
  );
}
