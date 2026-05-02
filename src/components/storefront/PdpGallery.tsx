"use client";

import { useState } from "react";
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

export default function PdpGallery({ photos, fallback }: Props) {
  const [active, setActive] = useState(0);
  const hasPhotos = photos.length > 0;
  const current = hasPhotos ? photos[active] : null;

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
      <div className="pdp-main-img">
        {hasPhotos && current ? (
          <Image
            src={current.url}
            alt={current.alt ?? fallback.name}
            width={900}
            height={1200}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ width: "100%", height: "auto", display: "block" }}
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
