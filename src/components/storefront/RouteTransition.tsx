"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = { children: React.ReactNode };

/**
 * Soft cross-page fade.
 *
 * Re-keys an inner div on every pathname change so the `ssg-route-fade`
 * keyframe re-fires — the page slides up 6px and fades from 0→1 over 420ms.
 * Cheaper and more reliable than the View Transitions API across browsers,
 * and pairs well with the existing `data-reveal` scroll motion that fires
 * inside each page once it's mounted.
 *
 * Reduced-motion is honoured by the keyframe rule in motion.css.
 */
export default function RouteTransition({ children }: Props) {
  const pathname = usePathname();
  const first = useRef(true);
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey(pathname);
  }, [pathname]);

  return (
    <div key={key} className="ssg-route-fade" style={{ minHeight: "inherit" }}>
      {children}
    </div>
  );
}
