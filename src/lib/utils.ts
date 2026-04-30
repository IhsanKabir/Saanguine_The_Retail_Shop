/**
 * Deterministic 32-bit hash on a string. Same as the prototype's `seed()`.
 * Used to derive a stable hue offset / pattern variation per product.
 */
export function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Format a BDT integer amount as `৳1,234`. */
export function formatBdt(n: number, locale: "en" | "bn" = "en"): string {
  const fmt = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-IN", {
    maximumFractionDigits: 0,
  });
  return `৳${fmt.format(n)}`;
}

/**
 * Format a Date for human display. Bengali locale uses native digits.
 */
export function formatDate(d: Date | string, locale: "en" | "bn" = "en"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Slug-safe identifier. */
export function slugify(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
    "x-" + Date.now().toString(36)
  );
}
