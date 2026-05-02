"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth-utils";

/**
 * Saved-address book for signed-in customers. Reuses the existing `addresses`
 * table; rows are keyed by `customerId = auth.uid()`. Default-address logic is
 * enforced server-side: setting a row to default unsets the previous default.
 */

const addrSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().max(40).optional().nullable(),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(6).max(40),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  area: z.string().max(80).optional().nullable(),
  city: z.string().min(1).max(80),
  district: z.string().max(80).optional().nullable(),
  division: z.string().max(80).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export async function listMyAddresses() {
  const user = await requireUser();
  return db.select().from(schema.addresses)
    .where(eq(schema.addresses.customerId, user.id))
    .orderBy(desc(schema.addresses.isDefault), desc(schema.addresses.id));
}

export async function saveAddress(input: z.infer<typeof addrSchema>) {
  const user = await requireUser();
  const data = addrSchema.parse(input);

  await db.transaction(async (tx) => {
    if (data.isDefault) {
      // Only one default per customer.
      await tx.update(schema.addresses)
        .set({ isDefault: false })
        .where(eq(schema.addresses.customerId, user.id));
    }
    if (data.id) {
      await tx.update(schema.addresses).set({
        label: data.label || null,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        area: data.area || null,
        city: data.city,
        district: data.district || null,
        division: data.division || null,
        postcode: data.postcode || null,
        isDefault: data.isDefault ?? false,
      }).where(and(
        eq(schema.addresses.id, data.id),
        eq(schema.addresses.customerId, user.id),
      ));
    } else {
      await tx.insert(schema.addresses).values({
        customerId: user.id,
        label: data.label || null,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        area: data.area || null,
        city: data.city,
        district: data.district || null,
        division: data.division || null,
        postcode: data.postcode || null,
        country: "Bangladesh",
        isDefault: data.isDefault ?? false,
      });
    }
  });

  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

export async function deleteAddress(id: string) {
  const user = await requireUser();
  await db.delete(schema.addresses).where(and(
    eq(schema.addresses.id, id),
    eq(schema.addresses.customerId, user.id),
  ));
  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

export async function setDefaultAddress(id: string) {
  const user = await requireUser();
  await db.transaction(async (tx) => {
    await tx.update(schema.addresses)
      .set({ isDefault: false })
      .where(eq(schema.addresses.customerId, user.id));
    await tx.update(schema.addresses)
      .set({ isDefault: true })
      .where(and(eq(schema.addresses.id, id), eq(schema.addresses.customerId, user.id)));
  });
  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}
