"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { and, eq, gt, lte, gte, isNull, or, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/auth-utils";

export type CouponValidation =
  | { ok: true; discountBdt: number; freeShipping: boolean; code: string; description: string | null }
  | { ok: false; error: string };

/**
 * Validate a coupon code + subtotal. Returns the discount in BDT.
 * Server-side only — never trusted from the client.
 */
export async function validateCoupon(rawCode: string, subtotalBdt: number): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code || code.length > 40) return { ok: false, error: "Enter a valid code." };

  const rows = await db.select().from(schema.coupons)
    .where(and(eq(sql`upper(${schema.coupons.code})`, code), eq(schema.coupons.isActive, true)))
    .limit(1);
  const c = rows[0];
  if (!c) return { ok: false, error: "Code not found or inactive." };

  const now = new Date();
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "This code is not yet active." };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, error: "This code has expired." };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, error: "This code has reached its usage limit." };
  if (subtotalBdt < c.minSubtotalBdt) return { ok: false, error: `Minimum subtotal ৳${c.minSubtotalBdt.toLocaleString("en-IN")} required.` };

  let discountBdt = 0;
  let freeShipping = false;
  if (c.type === "percent") {
    discountBdt = Math.min(subtotalBdt, Math.round(subtotalBdt * Math.max(0, Math.min(100, c.value)) / 100));
  } else if (c.type === "fixed") {
    discountBdt = Math.min(subtotalBdt, Math.max(0, c.value));
  } else if (c.type === "free_shipping") {
    freeShipping = true;
  }

  return { ok: true, discountBdt, freeShipping, code: c.code, description: c.description };
}

/**
 * Atomically increment usage and record redemption. Called from the order action
 * inside its transaction.
 */
export async function recordCouponRedemption(args: {
  code: string;
  orderId: string;
  discountBdt: number;
  customerEmail: string;
}): Promise<void> {
  const codeUpper = args.code.toUpperCase();
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(schema.coupons)
      .where(eq(sql`upper(${schema.coupons.code})`, codeUpper))
      .limit(1);
    if (!c) return;
    await tx.update(schema.coupons)
      .set({ usedCount: sql`${schema.coupons.usedCount} + 1` })
      .where(eq(schema.coupons.id, c.id));
    await tx.insert(schema.couponRedemptions).values({
      couponId: c.id,
      orderId: args.orderId,
      customerEmail: args.customerEmail,
      discountBdt: args.discountBdt,
    });
  });
}

// ─── Admin CRUD ────────────────────────────────────────────────────────
const couponInput = z.object({
  id: z.string().optional(),
  code: z.string().min(2).max(40).transform((s) => s.trim().toUpperCase()),
  description: z.string().max(200).optional().nullable(),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().int().min(0),
  minSubtotalBdt: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponInput = z.input<typeof couponInput>;

export async function listCoupons() {
  await requirePermission("coupons");
  return db.select().from(schema.coupons).orderBy(sql`${schema.coupons.createdAt} desc`);
}

export async function createCoupon(input: CouponInput) {
  await requirePermission("coupons");
  const data = couponInput.parse(input);
  await db.insert(schema.coupons).values({
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    minSubtotalBdt: data.minSubtotalBdt,
    maxUses: data.maxUses ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
  });
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function updateCoupon(id: string, input: CouponInput) {
  await requirePermission("coupons");
  const data = couponInput.parse(input);
  await db.update(schema.coupons).set({
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    minSubtotalBdt: data.minSubtotalBdt,
    maxUses: data.maxUses ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive,
  }).where(eq(schema.coupons.id, id));
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function deleteCoupon(id: string) {
  await requirePermission("coupons");
  await db.delete(schema.coupons).where(eq(schema.coupons.id, id));
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function toggleCouponActive(id: string) {
  await requirePermission("coupons");
  await db.update(schema.coupons)
    .set({ isActive: sql`not ${schema.coupons.isActive}` })
    .where(eq(schema.coupons.id, id));
  revalidatePath("/admin/coupons");
}
