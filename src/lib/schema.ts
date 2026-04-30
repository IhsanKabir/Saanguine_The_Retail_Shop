import { pgTable, text, integer, boolean, uuid, timestamp, jsonb, numeric, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Catalogue ─────────────────────────────────────────────────────────
export const segments = pgTable("segments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  tag: text("tag"),
  tagBn: text("tag_bn"),
  blurb: text("blurb"),
  blurbBn: text("blurb_bn"),
  hidden: boolean("hidden").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").unique().notNull(),
  name: text("name").notNull(),
  nameBn: text("name_bn"),
  slug: text("slug").unique().notNull(),
  segmentId: text("segment_id").references(() => segments.id),
  priceBdt: integer("price_bdt").notNull(),     // whole BDT (no paisa for v1)
  wasBdt: integer("was_bdt"),                   // strike-through price
  stock: integer("stock").default(0).notNull(),
  tag: text("tag"),                             // 'new'|'sale'|'limited'|'staff-pick'
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0).notNull(),
  status: text("status").default("live").notNull(),
  description: text("description"),
  descriptionBn: text("description_bn"),
  colors: jsonb("colors").$type<string[]>().default([]),
  sizes: jsonb("sizes").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// ─── Customers (Supabase Auth owns auth.users; we add a profile) ───────
export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").primaryKey(),                  // FK to auth.users.id
  fullName: text("full_name"),
  phone: text("phone"),                         // +8801XXXXXXXXX
  acceptsMarketing: boolean("accepts_marketing").default(false).notNull(),
  preferredLocale: text("preferred_locale").default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id"),              // FK to auth.users.id, nullable for guest checkout
  label: text("label"),                         // 'Home', 'Office'
  fullName: text("full_name"),
  phone: text("phone"),
  line1: text("line1"),
  line2: text("line2"),
  area: text("area"),                           // 'Gulshan'
  city: text("city"),                           // 'Dhaka'
  district: text("district"),                   // 'Dhaka'
  division: text("division"),                   // 'Dhaka'
  postcode: text("postcode"),
  country: text("country").default("Bangladesh"),
  isDefault: boolean("is_default").default(false).notNull(),
});

// ─── Orders ────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").unique().notNull(),     // 'SSG-10501'
  customerId: uuid("customer_id"),               // null for guest
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  status: text("status").default("pending").notNull(),
  // pending | cod_pending | paid | processing | shipped | delivered | cancelled | refunded
  paymentMethod: text("payment_method").notNull(),
  // 'cod' | 'card' | 'bkash' | 'nagad' | 'rocket' (later)
  paymentRef: text("payment_ref"),
  subtotalBdt: integer("subtotal_bdt").notNull(),
  shippingBdt: integer("shipping_bdt").default(0).notNull(),
  codFeeBdt: integer("cod_fee_bdt").default(0).notNull(),
  totalBdt: integer("total_bdt").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  shippingCourier: text("shipping_courier"),     // 'pathao' | 'steadfast'
  shippingTracking: text("shipping_tracking"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderLines = pgTable("order_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  nameSnapshot: text("name_snapshot").notNull(),
  skuSnapshot: text("sku_snapshot").notNull(),
  color: text("color"),
  size: text("size"),
  qty: integer("qty").notNull(),
  unitPriceBdt: integer("unit_price_bdt").notNull(),
  lineTotalBdt: integer("line_total_bdt").notNull(),
});

// ─── Reviews & Wishlist ────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id"),
  orderId: uuid("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  photoUrls: jsonb("photo_urls").$type<string[]>().default([]),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const wishlists = pgTable(
  "wishlists",
  {
    customerId: uuid("customer_id").notNull(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.customerId, t.productId] }),
  }),
);

// ─── Audit + Inventory log ─────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  payload: jsonb("payload"),
  ip: text("ip"),
  ua: text("ua"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryLog = pgTable("inventory_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: text("product_id").notNull().references(() => products.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),              // 'order'|'restock'|'adjustment'|'return'
  referenceId: text("reference_id"),
  actorId: uuid("actor_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Site settings (overflow when not in Sanity) ───────────────────────
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type aliases for app code ─────────────────────────────────────────
export type Segment = typeof segments.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderLine = typeof orderLines.$inferSelect;
export type Review = typeof reviews.$inferSelect;
