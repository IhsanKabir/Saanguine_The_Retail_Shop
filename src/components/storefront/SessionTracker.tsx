"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/routing";
import { track } from "@/lib/actions/track";

const KEY = "ssg-session-fired";

/**
 * Fires `session_start` once per browser session (sessionStorage)
 * and `page_view` on every route change. Mounted in the locale layout.
 */
export default function SessionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(KEY)) {
        track({ type: "session_start", path: pathname });
        sessionStorage.setItem(KEY, "1");
      }
    } catch { /* private mode etc. */ }
    // session_start: fire once on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    track({ type: "page_view", path: pathname }).catch(() => {});
  }, [pathname]);

  return null;
}
