/**
 * Server-side instrumentation entry point. Next.js 15 calls this once per
 * runtime when the app boots. Routes Sentry init to the right runtime config.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Hook for Sentry to capture nested-route errors thrown from server components,
 * route handlers, and server actions. Required by Next.js 15.
 */
export const onRequestError = Sentry.captureRequestError;
