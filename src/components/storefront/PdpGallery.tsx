"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Composition from "./Composition";

type Photo = { url: string; alt: string | null };
type Fallback = {
  cat: string;
  sku: string;
  name: string;
  tag: string | null;
};

type Props = {
  photos: Photo[];
  fallback: Fallback;
};

/**
 * PDP gallery with cross-fade on thumbnail switch.
 *
 * Each main image is keyed on the URL so React swaps the DOM node, which lets
 * the CSS keyframe `pdp-img-in` re-fire on every change. ~340ms feels like a
 * deliberate dissolve — not so slow it gets in the way of comparing variants.
 * Reduced-motion is handled by the keyframe definition itself.
 */
export default function PdpGallery({ photos, fallback }: Props) {
  const [active, setActive] = useState(0);
  const [imgKey, setImgKey] = useState(0);
  const prev = useRef(0);
  const hasPhotos = photos.length > 0;
  const current = hasPhotos ? photos[active] : null;

  // Bump the imgKey when the active index changes so the <Image> remounts
  // and replays the fade-in keyframe. Avoids relying on React's diffing
  // skipping the keyed change.
  useEffect(() => {
    if (prev.current !== active) {
      setImgKey((k) => k + 1);
      prev.current = active;
    }
  }, [active]);

  return (
    <div className="pdp-gallery">
      <div className="pdp-thumbs">
        {hasPhotos
          ? photos.map((p, i) => (
              <button
                key={p.url}
                type="button"
                onClick={() => setActive(i)}
                className={"pdp-thumb " + (i === active ? "active" : "")}
                aria-label={`View photo ${i + 1}`}
                style={{ padding: 0, border: "none", cursor: "pointer", background: "transparent" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))
          : [0, 1, 2, 3].map((i) => (
              <div key={i} className={"pdp-thumb " + (i === 0 ? "active" : "")}>
                <Composition cat={fallback.cat} sku={fallback.sku + "-" + i} name={fallback.name} variant={i} small />
              </div>
            ))}
      </div>
      <div className="pdp-main-img pdp-main-img--fade">
        {hasPhotos && current ? (
          <Image
            key={imgKey}
            src={current.url}
            alt={current.alt ?? fallback.name}
            width={900}
            height={1200}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ width: "100%", height: "auto", display: "block" }}
            className="pdp-img-fade"
          />
        ) : (
          <Composition
            cat={fallback.cat}
            sku={fallback.sku}
            name={fallback.name}
            tag={fallback.tag}
            ribbon={fallback.tag === "new" ? "New" : null}
            sale={fallback.tag === "sale"}
          />
        )}
      </div>
    </div>
  );
}
