"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, isNull, gte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentUser, requirePermission } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email/brevo";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://saanguine-the-retail-shop.vercel.app").replace(/\/$/, "");

const subscribeSchema = z.object({
  productId: z.string().min(1).max(120),
  email: z.string().email().max(200),
});

/**
 * Customer-facing: register an email to be notified when this product is back in stock.
 * If the visitor is signed-in we associate the row with their `customerId`.
 * The unique index on (product_id, lower(email)) where notified_at is null
 * prevents duplicate pending registrations.
 */
export async function subscribeBackInStock(input: z.infer<typeof subscribeSchema>) {
  const data = subscribeSchema.parse(input);
  const user = await getCurrentUser();

  // Soft rate-limit: cap one email at 10 active subscriptions per hour.
  // Defends against the action being abused as an email-spam vector or
  // enumeration tool. Returns a uniform success shape so the caller can't
  // distinguish "already registered" from "rate-limited" via response shape.
  const oneHourAgo = new Date(Date.now() - 60 * 60_000);
  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(schema.stockNotifications)
    .where(and(
      sql`lower(${schema.stockNotifications.email}) = lower(${data.email})`,
      gte(schema.stockNotifications.createdAt, oneHourAgo),
    ));
  if ((recent ?? 0) >= 10) {
    // Same shape as success — no information leak about whether the email
    // exists in the system.
    return { ok: true as const, alreadyRegistered: true };
  }

  // Idempotent: check first, insert if missing.
  const existing = await db.select().from(schema.stockNotifications).where(and(
    eq(schema.stockNotifications.productId, data.productId),
    sql`lower(${schema.stockNotifications.email}) = lower(${data.email})`,
    isNull(schema.stockNotifications.notifiedAt),
  )).limit(1);

  if (existing.length > 0) {
    return { ok: true as const, alreadyRegistered: true };
  }

  await db.insert(schema.stockNotifications).values({
    productId: data.productId,
    customerId: user?.id ?? null,
    email: data.email,
  });

  return { ok: true as const, alreadyRegistered: false };
}

/**
 * Admin trigger: when a product is restocked, fire emails to every pending
 * subscriber and mark them notified. Best-effort sends; one failure does not
 * block the others.
 */
export async function notifyBackInStock(productId: string) {
  await requirePermission("inventory");

  const [product] = await db.select().from(schema.products).where(eq(schema.products.id, productId)).limit(1);
  if (!product) return { ok: false as const, error: "Product not found" };
  if (product.stock <= 0) return { ok: false as const, error: "Product is still out of stock — restock before notifying." };

  const pending = await db.select().from(schema.stockNotifications).where(and(
    eq(schema.stockNotifications.productId, productId),
    isNull(schema.stockNotifications.notifiedAt),
  ));

  if (pending.length === 0) return { ok: true as const, notified: 0 };

  const url = `${SITE_URL}/en/product/${product.slug}`;
  const subject = `Back in the maison · ${product.name}`;
  const html = backInStockEmail(product.name, url);

  let notified = 0;
  for (const row of pending) {
    try {
      await sendEmail({ to: row.email, subject, html });
      await db.update(schema.stockNotifications)
        .set({ notifiedAt: new Date() })
        .where(eq(schema.stockNotifications.id, row.id));
      notified++;
    } catch {
      // Skip this row but keep going.
    }
  }

  revalidatePath("/[locale]/admin/inventory", "page");
  return { ok: true as const, notified };
}

/** Admin: count pending notifications per product, for the inventory list. */
export async function pendingNotificationsByProduct(): Promise<Map<string, number>> {
  await requirePermission("inventory");
  const rows = await db.execute<{ product_id: string; count: number }>(sql`
    select ${schema.stockNotifications.productId} as product_id, count(*)::int as count
    from ${schema.stockNotifications}
    where ${schema.stockNotifications.notifiedAt} is null
    group by ${schema.stockNotifications.productId}
  `).catch(() => []);
  return new Map(rows.map((r) => [r.product_id, r.count]));
}

function backInStockEmail(productName: string, url: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fdfbf7;font-family:Georgia,serif;color:#2a1854;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fdfbf7;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="540" cellspacing="0" cellpadding="0" style="background:white;max-width:540px;width:100%;">
        <tr><td style="padding:36px 36px 16px;border-bottom:1px solid #e8e0d2;text-align:center;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:28px;color:#2a1854;">Saanguine</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:.4em;color:#a07e2c;margin-top:6px;">MAISON · MMXXVI</div>
        </td></tr>
        <tr><td style="padding:32px 36px;line-height:1.7;">
          <p style="font-size:11px;letter-spacing:.4em;color:#a07e2c;margin:0 0 14px;">BACK ON THE SHELF</p>
          <h2 style="font-size:24px;font-weight:400;color:#2a1854;margin:0 0 14px;">${productName}</h2>
          <p style="font-size:14px;color:#3a2a64;margin:0 0 22px;">The piece you asked the maison to remember has returned. Quantities are limited &mdash; we will not write again until you say so.</p>
          <p style="margin:0 0 6px;"><a href="${url}" style="display:inline-block;background:#2a1854;color:#fdfbf7;text-decoration:none;padding:12px 22px;font-family:Georgia,serif;font-size:14px;letter-spacing:.05em;">Return to the piece &rarr;</a></p>
        </td></tr>
        <tr><td style="padding:18px 36px 28px;border-top:1px solid #e8e0d2;text-align:center;font-family:'Courier New',monospace;font-size:10px;letter-spacing:.2em;color:#7a6a52;">
          MAISON SAANGUINE · DHAKA
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
