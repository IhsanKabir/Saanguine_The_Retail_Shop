"use client";

import Script from "next/script";

/**
 * Cloudflare Web Analytics — privacy-friendly page-view tracking.
 * No cookies, no fingerprinting, doesn't trigger consent banner requirements.
 * Configure NEXT_PUBLIC_CF_BEACON_TOKEN to activate; renders nothing without it.
 */
export default function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
      defer
    />
  );
}
