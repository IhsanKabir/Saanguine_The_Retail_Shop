"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, requirePermission } from "@/lib/auth-utils";
import { PERMISSIONS, type Permission, type AdminRole } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { createPathaoOrder } from "@/lib/shipping/pathao";
import { createSteadfastOrder } from "@/lib/shipping/steadfast";
import { sendEmail } from "@/lib/email/brevo";
import { orderShippedEmail, type OrderEmailLine } from "@/lib/email/templates";
import { sendSms } from "@/lib/sms/ssl-wireless";

// ─── Segments ──────────────────────────────────────────────────────────
const segSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(80),
  nameBn: z.string().max(80).optional().nullable(),
  tag: z.string().max(40).optional().nullable(),
  tagBn: z.string().max(40).optional().nullable(),
  blurb: z.string().max(200).optional().nullable(),
  blurbBn: z.string().max(200).optional().nullable(),
  hidden: z.boolean().optional(),
  stockEnabled: z.boolean().optional(),
  preorderEnabled: z.boolean().optional(),
});

export async function createSegment(input: z.infer<typeof segSchema>) {
  await requireAdmin();
  const data = segSchema.parse(input);
  const id = slugify(data.id || data.name);
  await db.insert(schema.segments).values({
    id,
    name: data.name,
    nameBn: data.nameBn || null,
    tag: data.tag || null,
    tagBn: data.tagBn || null,
    blurb: data.blurb || null,
    blurbBn: data.blurbBn || null,
    hidden: data.hidden ?? false,
    stockEnabled: data.stockEnabled ?? true,
    preorderEnabled: data.preorderEnabled ?? false,
  });
  revalidatePath("/", "layout");
  return { ok: true as const, id };
}

export async function updateSegment(id: string, patch: Partial<z.infer<typeof segSchema>>) {
  await requireAdmin();
  await db.update(schema.segments).set({
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.nameBn !== undefined && { nameBn: patch.nameBn || null }),
    ...(patch.tag !== undefined && { tag: patch.tag || null }),
    ...(patch.tagBn !== undefined && { tagBn: patch.tagBn || null }),
    ...(patch.blurb !== undefined && { blurb: patch.blurb || null }),
    ...(patch.blurbBn !== undefined && { blurbBn: patch.blurbBn || null }),
    ...(patch.hidden !== undefined && { hidden: patch.hidden }),
    ...(patch.stockEnabled !== undefined && { stockEnabled: patch.stockEnabled }),
    ...(patch.preorderEnabled !== undefined && { preorderEnabled: patch.preorderEnabled }),
  }).where(eq(schema.segments.id, id));
  revalidatePath("/[locale]/shop", "layout");
  revalidatePath("/[locale]/admin/segments", "page");
  return { ok: true as const };
}

export async function toggleSegment(id: string) {
  await requireAdmin();
  await db.update(schema.segments)
    .set({ hidden: sql`not ${schema.segments.hidden}` })
    .where(eq(schema.segments.id, id));
  revalidatePath("/[locale]/admin/segments", "page");
  revalidatePath("/[locale]", "layout");
}

export async function moveSegment(id: string, delta: number) {
  await requireAdmin();
  const all = await db.select().from(schema.segments).orderBy(schema.segments.sortOrder);
  const idx = all.findIndex((s) => s.id === id);
  const j = idx + delta;
  if (idx < 0 || j < 0 || j >= all.length) return;
  await db.transaction(async (tx) => {
    await tx.update(schema.segments).set({ sortOrder: j }).where(eq(schema.segments.id, all[idx].id));
    await tx.update(schema.segments).set({ sortOrder: idx }).where(eq(schema.segments.id, all[j].id));
  });
  revalidatePath("/", "layout");
}

export async function deleteSegment(id: string) {
  await requireAdmin();
  // Ensure "uncategorised" exists, reparent products, then delete the segment.
  await db.transaction(async (tx) => {
    const orphans = await tx.select().from(schema.products).where(eq(schema.products.segmentId, id));
    if (orphans.length > 0) {
      const unc = await tx.select().from(schema.segments).where(eq(schema.segments.id, "uncategorised")).limit(1);
      if (unc.length === 0) {
        await tx.insert(schema.segments).values({
          id: "uncategorised",
          name: "Uncategorised",
          tag: "Misc",
          blurb: "Pieces between categories",
          hidden: false,
          sortOrder: 999,
        });
      }
      await tx.update(schema.products).set({ segmentId: "uncategorised" }).where(eq(schema.products.segmentId, id));
    }
    await tx.delete(schema.segments).where(eq(schema.segments.id, id));
  });
  revalidatePath("/", "layout");
}

// ─── Products ──────────────────────────────────────────────────────────
const prodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  nameBn: z.string().max(120).optional().nullable(),
  sku: z.string().min(1).max(40),
  segmentId: z.string(),
  priceBdt: z.number().int().min(0),
  wasBdt: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  tag: z.string().max(20).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  descriptionBn: z.string().max(2000).optional().nullable(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
});

export async function createProduct(input: z.infer<typeof prodSchema>) {
  await requireAdmin();
  const data = prodSchema.parse(input);
  const id = data.id || `p-${Date.now().toString(36)}`;
  const slug = slugify(data.name);
  await db.insert(schema.products).values({
    id,
    name: data.name,
    nameBn: data.nameBn || null,
    sku: data.sku.toUpperCase(),
    slug,
    segmentId: data.segmentId,
    priceBdt: data.priceBdt,
    wasBdt: data.wasBdt || null,
    stock: data.stock,
    tag: data.tag || null,
    description: data.description || null,
    descriptionBn: data.descriptionBn || null,
    colors: data.colors || [],
    sizes: data.sizes || [],
  });
  revalidatePath("/", "layout");
  return { ok: true as const, id, slug };
}

export async function updateProduct(id: string, patch: Partial<z.infer<typeof prodSchema>>) {
  await requireAdmin();
  const update: Record<string, unknown> = {};
  for (const k of ["name","nameBn","sku","segmentId","priceBdt","wasBdt","stock","tag","description","descriptionBn","colors","sizes"] as const) {
    if (patch[k] !== undefined) (update as Record<string, unknown>)[k] = patch[k];
  }
  if (typeof patch.sku === "string") update.sku = patch.sku.toUpperCase();
  if (typeof patch.name === "string") update.slug = slugify(patch.name);
  await db.update(schema.products).set(update).where(eq(schema.products.id, id));
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.delete(schema.products).where(eq(schema.products.id, id));
  revalidatePath("/", "layout");
}

export async function adjustStock(id: string, delta: number, reason: string) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    await tx.update(schema.products)
      .set({ stock: sql`greatest(0, ${schema.products.stock} + ${delta})` })
      .where(eq(schema.products.id, id));
    await tx.insert(schema.inventoryLog).values({ productId: id, delta, reason });
  });
  revalidatePath("/", "layout");
}

// ─── Orders ────────────────────────────────────────────────────────────
const validStatuses = ["pending","cod_pending","paid","processing","shipped","delivered","cancelled","refunded"] as const;

export async function updateOrderStatus(orderId: string, status: typeof validStatuses[number]) {
  await requireAdmin();
  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, orderId));
  revalidatePath("/admin", "layout");
}

const courierSchema = z.object({
  orderId: z.string(),
  courier: z.enum(["pathao", "steadfast"]),
  // Pathao-specific (city/zone IDs from their API)
  pathaoCity: z.number().optional(),
  pathaoZone: z.number().optional(),
  pathaoArea: z.number().optional(),
});

export async function bookCourier(input: z.infer<typeof courierSchema>) {
  await requireAdmin();
  const data = courierSchema.parse(input);
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, data.orderId));
  if (!order) return { ok: false as const, error: "Order not found" };
  const lines = await db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, order.id));
  const addr = order.shippingAddress as { fullName: string; phone: string; line1: string; area?: string; city: string };
  const itemQty = lines.reduce((s, l) => s + l.qty, 0);

  let trackingCode = "";
  try {
    if (data.courier === "pathao") {
      if (!data.pathaoCity || !data.pathaoZone) {
        return { ok: false as const, error: "Pathao city + zone required" };
      }
      const r = await createPathaoOrder({
        merchantOrderId: order.number,
        recipientName: addr.fullName,
        recipientPhone: addr.phone,
        recipientAddress: `${addr.line1}${addr.area ? ", " + addr.area : ""}, ${addr.city}`,
        recipientCity: data.pathaoCity,
        recipientZone: data.pathaoZone,
        recipientArea: data.pathaoArea,
        itemQty,
        itemWeight: 0.5,
        amountToCollect: order.paymentMethod === "cod" ? order.totalBdt : 0,
        itemDescription: lines.map((l) => l.nameSnapshot).join(", ").slice(0, 200),
      });
      trackingCode = r.trackingCode;
    } else {
      const r = await createSteadfastOrder({
        invoice: order.number,
        recipientName: addr.fullName,
        recipientPhone: addr.phone,
        recipientAddress: `${addr.line1}${addr.area ? ", " + addr.area : ""}, ${addr.city}`,
        codAmount: order.paymentMethod === "cod" ? order.totalBdt : 0,
      });
      trackingCode = r.trackingCode;
    }
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Courier API failed" };
  }

  await db.update(schema.orders).set({
    status: "shipped",
    shippingCourier: data.courier,
    shippingTracking: trackingCode,
  }).where(eq(schema.orders.id, order.id));

  // Notify customer (best-effort)
  if (order.guestEmail) {
    const emailLines: OrderEmailLine[] = lines.map((l) => ({
      name: l.nameSnapshot,
      qty: l.qty,
      lineTotalBdt: l.lineTotalBdt,
      color: l.color,
      size: l.size,
    }));
    const { subject, html } = orderShippedEmail({
      number: order.number,
      customerName: addr.fullName,
      customerEmail: order.guestEmail,
      customerPhone: addr.phone,
      shippingAddress: { line1: addr.line1, city: addr.city, area: addr.area },
      lines: emailLines,
      subtotalBdt: order.subtotalBdt,
      shippingBdt: order.shippingBdt,
      codFeeBdt: order.codFeeBdt,
      totalBdt: order.totalBdt,
      paymentMethod: order.paymentMethod as "cod",
      courier: data.courier,
      tracking: trackingCode,
    });
    sendEmail({ to: order.guestEmail, toName: addr.fullName, subject, html }).catch(() => {});
  }
  if (order.guestPhone) {
    sendSms(order.guestPhone, `Maison Saanguine: ${order.number} shipped via ${data.courier} (${trackingCode}).`)
      .catch(() => {});
  }

  revalidatePath("/admin", "layout");
  return { ok: true as const, trackingCode };
}

// ─── Editorial / brand ─────────────────────────────────────────────────
const brandSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().max(160).optional(),
  email: z.string().email().optional(),
  announcement: z.string().max(200).optional(),
});

export async function updateBrand(input: z.infer<typeof brandSchema>) {
  await requireAdmin();
  const data = brandSchema.parse(input);
  await db.insert(schema.siteSettings).values({ key: "brand", value: data })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: data } });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function getBrand() {
  const rows = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, "brand"));
  return (rows[0]?.value as z.infer<typeof brandSchema>) || null;
}

// ─── Admin user management (owner only) ───────────────────────────────
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

const subadminInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["owner", "admin", "subadmin"]),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export type AdminUserSummary = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
  createdAt: string;
  lastSignInAt: string | null;
};

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  await requirePermission("users");
  const sb = adminClient();
  const all: AdminUserSummary[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    for (const u of data.users) {
      const meta = (u.app_metadata ?? {}) as { role?: AdminRole; permissions?: Permission[] };
      const role: AdminRole = meta.role && ["owner", "admin", "subadmin"].includes(meta.role) ? meta.role : "customer";
      if (role === "customer") continue; // only show admin-tier users
      all.push({
        id: u.id,
        email: u.email ?? "",
        role,
        permissions: meta.permissions ?? [],
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    }
    if (data.users.length < 100) break;
    page++;
  }
  return all;
}

export async function inviteAdminUser(input: z.infer<typeof subadminInputSchema>) {
  await requirePermission("users");
  const data = subadminInputSchema.parse(input);
  const sb = adminClient();
  const { data: existing } = await sb.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());
  const appMeta = data.role === "subadmin"
    ? { role: data.role, permissions: data.permissions }
    : { role: data.role };
  if (found) {
    await sb.auth.admin.updateUserById(found.id, {
      password: data.password,
      email_confirm: true,
      app_metadata: { ...found.app_metadata, ...appMeta },
    });
  } else {
    await sb.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      app_metadata: appMeta,
    });
  }
  revalidatePath("/admin/users", "page");
  return { ok: true as const };
}

export async function updateAdminUser(id: string, patch: { role?: AdminRole; permissions?: Permission[] }) {
  await requirePermission("users");
  const sb = adminClient();
  const { data: { user }, error: getErr } = await sb.auth.admin.getUserById(id);
  if (getErr || !user) throw new Error("User not found");
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...meta };
  if (patch.role !== undefined) next.role = patch.role;
  if (patch.permissions !== undefined) next.permissions = patch.permissions;
  await sb.auth.admin.updateUserById(id, { app_metadata: next });
  revalidatePath("/admin/users", "page");
  return { ok: true as const };
}

export async function demoteAdminUser(id: string) {
  await requirePermission("users");
  const sb = adminClient();
  const { data: { user } } = await sb.auth.admin.getUserById(id);
  if (!user) throw new Error("User not found");
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  delete meta.role;
  delete meta.permissions;
  await sb.auth.admin.updateUserById(id, { app_metadata: meta });
  revalidatePath("/admin/users", "page");
  return { ok: true as const };
}

export async function deleteAdminUser(id: string) {
  await requirePermission("users");
  const sb = adminClient();
  await sb.auth.admin.deleteUser(id);
  revalidatePath("/admin/users", "page");
  return { ok: true as const };
}
