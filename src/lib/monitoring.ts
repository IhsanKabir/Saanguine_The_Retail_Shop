import * as Sentry from "@sentry/nextjs";

/**
 * Capture an unexpected error with optional structured context. Use in
 * server actions and route handlers where we want to log a failure that
 * won't propagate (e.g. fire-and-forget email sends, courier webhook
 * failures). No-op when Sentry is not configured.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
    return;
  }
  Sentry.captureException(error);
}

/**
 * Identify the current customer to Sentry so errors are grouped per user.
 * Call from auth boundary code (e.g. after `requireUser()`).
 */
export function identifyUser(user: { id: string; email?: string | null } | null) {
  Sentry.setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
}
