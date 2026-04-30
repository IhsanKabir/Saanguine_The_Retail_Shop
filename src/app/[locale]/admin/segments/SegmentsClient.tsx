"use client";

import { useState, useTransition } from "react";
import { createSegment, updateSegment, toggleSegment, moveSegment, deleteSegment } from "@/lib/actions/admin";
import type { Segment, Product } from "@/lib/schema";
import Composition from "@/components/storefront/Composition";
import Icon from "@/components/storefront/Icon";

type Props = { segments: Segment[]; products: Product[] };

type Editing = {
  mode: "new" | "edit";
  cat: { id?: string; name: string; nameBn: string; tag: string; tagBn: string; blurb: string; blurbBn: string; hidden: boolean };
};

export default function SegmentsClient({ segments, products }: Props) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [pendingDel, setPendingDel] = useState<Segment | null>(null);
  const [, startTransition] = useTransition();

  const counts: Record<string, number> = {};
  products.forEach((p) => { if (p.segmentId) counts[p.segmentId] = (counts[p.segmentId] || 0) + 1; });

  const startNew = () => setEditing({
    mode: "new",
    cat: { name: "", nameBn: "", tag: "Maison", tagBn: "মেইসন", blurb: "", blurbBn: "", hidden: false },
  });

  const onSave = () => {
    if (!editing) return;
    if (editing.cat.name.trim().length < 1) return;
    startTransition(async () => {
      if (editing.mode === "new") {
        await createSegment({
          name: editing.cat.name,
          nameBn: editing.cat.nameBn || null,
          tag: editing.cat.tag,
          tagBn: editing.cat.tagBn || null,
          blurb: editing.cat.blurb || null,
          blurbBn: editing.cat.blurbBn || null,
          hidden: editing.cat.hidden,
        });
      } else if (editing.cat.id) {
        await updateSegment(editing.cat.id, {
          name: editing.cat.name,
          nameBn: editing.cat.nameBn || null,
          tag: editing.cat.tag,
          tagBn: editing.cat.tagBn || null,
          blurb: editing.cat.blurb || null,
          blurbBn: editing.cat.blurbBn || null,
          hidden: editing.cat.hidden,
        });
      }
      setEditing(null);
    });
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 20 }}>
        <div>
          <h1 className="admin-h1">Segments</h1>
          <p className="admin-sub">{segments.length} segments · {segments.filter((c) => !c.hidden).length} live · {segments.filter((c) => c.hidden).length} hidden</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={startNew}><Icon name="check" size={14}/> New Segment</button>
      </div>

      <div className="seg-grid">
        {segments.map((c, i) => (
          <div key={c.id} className={"seg-card " + (c.hidden ? "is-hidden" : "")}>
            <div className="seg-cover"><Composition cat={c.id} sku={c.id} name={c.name}/></div>
            <div className="seg-body">
              <div className="seg-row">
                <div className="seg-tag">{c.tag}</div>
                <span className={"seg-status " + (c.hidden ? "draft" : "live")}>{c.hidden ? "Hidden" : "Live"}</span>
              </div>
              <h3 className="seg-name">{c.name}</h3>
              <p className="seg-blurb">{c.blurb || <em style={{ color: "var(--ink-soft)" }}>No description</em>}</p>
              <div className="seg-meta">
                <span><b>{counts[c.id] || 0}</b> piece{(counts[c.id] || 0) === 1 ? "" : "s"}</span>
                <span className="mono">{c.id}</span>
              </div>
            </div>
            <div className="seg-actions">
              <button className="seg-btn" onClick={() => startTransition(() => moveSegment(c.id, -1))} disabled={i === 0}>↑</button>
              <button className="seg-btn" onClick={() => startTransition(() => moveSegment(c.id, +1))} disabled={i === segments.length - 1}>↓</button>
              <button className="seg-btn" onClick={() => startTransition(() => toggleSegment(c.id))}>
                <Icon name={c.hidden ? "feather" : "x"} size={14}/>
              </button>
              <button className="seg-btn" onClick={() => setEditing({
                mode: "edit",
                cat: {
                  id: c.id,
                  name: c.name, nameBn: c.nameBn || "",
                  tag: c.tag || "", tagBn: c.tagBn || "",
                  blurb: c.blurb || "", blurbBn: c.blurbBn || "",
                  hidden: c.hidden,
                },
              })}><Icon name="feather" size={14}/></button>
              <button className="seg-btn danger" onClick={() => setPendingDel(c)}><Icon name="x" size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <>
          <div className="overlay" onClick={() => setEditing(null)}/>
          <div className="seg-modal">
            <div className="seg-modal-hd">
              <h3 className="serif">{editing.mode === "new" ? "New Segment" : "Edit · " + editing.cat.name}</h3>
              <button className="icon-btn" onClick={() => setEditing(null)}><Icon name="x"/></button>
            </div>
            <div className="seg-modal-body">
              <div className="seg-modal-preview">
                <Composition cat={editing.cat.id || "clothing"} sku={editing.cat.id || "new"} name={editing.cat.name || "Untitled"}/>
              </div>
              <div className="seg-modal-fields">
                <div className="row">
                  <div className="field"><label>Name (EN)</label><input value={editing.cat.name} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, name: e.target.value } })}/></div>
                  <div className="field"><label>Name (বাংলা)</label><input value={editing.cat.nameBn} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, nameBn: e.target.value } })}/></div>
                </div>
                <div className="row">
                  <div className="field"><label>Tag (EN)</label><input value={editing.cat.tag} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, tag: e.target.value } })}/></div>
                  <div className="field"><label>Tag (বাংলা)</label><input value={editing.cat.tagBn} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, tagBn: e.target.value } })}/></div>
                </div>
                <div className="field"><label>Blurb (EN)</label><input value={editing.cat.blurb} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, blurb: e.target.value } })}/></div>
                <div className="field"><label>Blurb (বাংলা)</label><input value={editing.cat.blurbBn} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, blurbBn: e.target.value } })}/></div>
                <label className="seg-check">
                  <input type="checkbox" checked={editing.cat.hidden} onChange={(e) => setEditing({ ...editing, cat: { ...editing.cat, hidden: e.target.checked } })}/>
                  Hide from storefront
                </label>
              </div>
            </div>
            <div className="seg-modal-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={onSave}>{editing.mode === "new" ? "Create" : "Save"}</button>
            </div>
          </div>
        </>
      )}

      {pendingDel && (
        <>
          <div className="overlay" onClick={() => setPendingDel(null)}/>
          <div className="seg-confirm">
            <h3 className="serif" style={{ margin: "0 0 12px" }}>Delete &quot;{pendingDel.name}&quot;?</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
              {(counts[pendingDel.id] || 0) > 0
                ? `${counts[pendingDel.id]} piece(s) will be moved to "Uncategorised".`
                : "This segment is empty."}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPendingDel(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: "var(--err)", color: "white", border: "none" }}
                onClick={() => startTransition(async () => {
                  await deleteSegment(pendingDel.id);
                  setPendingDel(null);
                })}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
