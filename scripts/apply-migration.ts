/**
 * Apply a single SQL migration file via the session pooler.
 * Usage:  npx tsx scripts/apply-migration.ts supabase/migrations/0003_events.sql
 */
import * as dotenv from "dotenv";
dotenv.config({ override: true });
import postgres from "postgres";
import { readFileSync } from "fs";

function toSessionPooler(url: string): string {
  const u = new URL(url);
  if (u.port === "6543") u.port = "5432";
  u.search = "";
  return u.toString();
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: npx tsx scripts/apply-migration.ts <path-to-sql>");
  process.exit(1);
}

const sql = postgres(toSessionPooler(process.env.DATABASE_URL!), { max: 1, prepare: false });

(async () => {
  console.log(`→ Applying ${file}`);
  const text = readFileSync(file, "utf-8");
  await sql.unsafe(text);
  console.log("✓ Applied");
  await sql.end();
})().catch(async (e) => {
  console.error("✗", e.message);
  await sql.end().catch(() => {});
  process.exit(1);
});
