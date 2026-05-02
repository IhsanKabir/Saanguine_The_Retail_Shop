"use client";

import { useEffect } from "react";

const KEY = "ssg-recent-v1";
const MAX = 12;

/**
 * Mounted on the PDP. Pushes the current productId to a localStorage list,
 * deduped, capped at MAX, newest-first. The home + PDP read this list on
 * the client and call back to the server to fetch the actual product data
 * (via `RecentlyViewedStrip`).
 */
export default function RecentlyViewedTracker({ productId }: { productId: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [productId, ...list.filter((id) => id !== productId)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // private mode etc.
    }
  }, [productId]);
  return null;
}

/** Read-only helper for client components that need the list. */
export function readRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
