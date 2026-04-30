import type { CSSProperties } from "react";
import { seed } from "@/lib/utils";

type Props = {
  cat: string;
  sku?: string;
  name?: string;
  tag?: string | null;
  variant?: number;
  small?: boolean;
  ribbon?: string | null;
  sale?: boolean;
  style?: CSSProperties;
};

/**
 * Generative cover art keyed by category + product. Replaces real photography
 * at launch — the maison's primary visual identity until the photo budget arrives.
 *
 * The CSS in atelier.css uses --cmp-h (hue offset) and --cmp-i (initial letter)
 * to produce per-product variations.
 */
export default function Composition({
  cat,
  sku,
  name,
  tag,
  variant = 0,
  small = false,
  ribbon,
  sale,
  style,
}: Props) {
  const initial = (name || sku || "S").trim().charAt(0).toUpperCase();
  const h = (seed((sku || name || cat || "x") + variant) % 60) - 30;

  const cls = [
    "cmp",
    `cmp-${cat}`,
    small && "cmp-sm",
    tag === "new" && "is-new",
  ].filter(Boolean).join(" ");

  const css: CSSProperties = {
    ...style,
    ["--cmp-h" as string]: String(h),
    ["--cmp-i" as string]: `"${initial}"`,
  };

  return (
    <div className={cls} data-v={variant} style={css}>
      <span className="cmp-grain" />
      <span className="cmp-mark" />
      {!small && <span className="cmp-corner">{(sku || "SSG").slice(-3)}</span>}
      {!small && <span className="cmp-cap">{cat}</span>}
      {ribbon && <span className="ribbon">{ribbon}</span>}
      {sale && <span className="ribbon sale">Sale</span>}
    </div>
  );
}
