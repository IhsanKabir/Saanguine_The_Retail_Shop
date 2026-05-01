/**
 * Create or update a subadmin with scoped permissions.
 *
 * Usage:
 *   npx tsx scripts/create-subadmin.ts <email> <password> <comma-separated-permissions>
 *   npx tsx scripts/create-subadmin.ts <email> <password> --template <template-name>
 *
 * Examples:
 *   npx tsx scripts/create-subadmin.ts fulfilment@x.com Pass1234 dashboard,orders,inventory
 *   npx tsx scripts/create-subadmin.ts catalogue@x.com Pass1234 --template catalogue
 *
 * Available templates: fulfilment, catalogue, editorial, analyst, manager
 *
 * After running, the user signs in at /en/sign-in with their email + password.
 * They'll see only the admin sections their permissions allow.
 */
import * as dotenv from "dotenv";
dotenv.config({ override: true });
import { createClient } from "@supabase/supabase-js";
import { PERMISSIONS, SUBADMIN_TEMPLATES, type Permission } from "../src/lib/permissions";

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
let permissions: Permission[];

if (args[2] === "--template") {
  const tpl = SUBADMIN_TEMPLATES[args[3]];
  if (!tpl) {
    console.error(`Unknown template "${args[3]}". Available: ${Object.keys(SUBADMIN_TEMPLATES).join(", ")}`);
    process.exit(1);
  }
  permissions = [...tpl.permissions];
} else if (args[2]) {
  const requested = args[2].split(",").map((s) => s.trim()).filter(Boolean) as Permission[];
  const invalid = requested.filter((p) => !PERMISSIONS.includes(p));
  if (invalid.length) {
    console.error(`Unknown permission(s): ${invalid.join(", ")}`);
    console.error(`Valid: ${PERMISSIONS.join(", ")}`);
    process.exit(1);
  }
  permissions = requested;
} else {
  console.error("Usage:");
  console.error("  npx tsx scripts/create-subadmin.ts <email> <password> <perm1,perm2,...>");
  console.error("  npx tsx scripts/create-subadmin.ts <email> <password> --template <template>");
  console.error(`Templates: ${Object.keys(SUBADMIN_TEMPLATES).join(", ")}`);
  console.error(`Permissions: ${PERMISSIONS.join(", ")}`);
  process.exit(1);
}

if (!email || !email.includes("@") || !password || password.length < 6) {
  console.error("Email and a 6+ char password are required.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

(async () => {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  const appMeta = { role: "subadmin", permissions };

  if (existing) {
    console.log(`→ User exists, updating to subadmin with permissions: ${permissions.join(", ")}`);
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, ...appMeta },
    });
    if (error) throw error;
  } else {
    console.log(`→ Creating new subadmin with permissions: ${permissions.join(", ")}`);
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: appMeta,
    });
    if (error) throw error;
  }

  console.log(`✓ ${email} can now sign in at /en/sign-in.`);
  console.log(`  They will see only: ${permissions.join(", ")}`);
})().catch((e) => {
  console.error("✗ failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
