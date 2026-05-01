"use server";

import { trackEvent, type EventType } from "@/lib/events";

/**
 * Client-callable wrapper around the server-side trackEvent.
 * Marked "use server" so it can be imported into Client Components.
 */
export async function track(input: {
  type: EventType;
  productId?: string;
  customerId?: string;
  payload?: Record<string, unknown>;
  path?: string;
}): Promise<void> {
  await trackEvent(input);
}
