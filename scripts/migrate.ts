/**
 * One-shot migration runner. Uses the DIRECT (port 5432) connection because
 * the pooler (port 6543, transaction mode) blocks DDL that touches the auth
 * schema. Derives the direct URL from DATABASE_URL automatically.
 */
import * as dotenv from "dotenv";
dotenv.config({ override: true });
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pooled = process.env.DATABASE_URL!;
if (!pooled) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

// Convert transaction-pooler URL (6543) to session-pooler URL (5432).
// Session pooler supports DDL where transaction pooler does not.
function toSessionPooler(url: string): string {
  const u = new URL(url);
  if (u.port === "6543") u.port = "5432";
  u.search = ""; // remove pgbouncer=true flag (not needed for session mode)
  return u.toString();
}

const direct = toSessionPooler(pooled);
console.log("→ Using session pooler (port 5432, DDL-capable)");

const sql = postgres(direct, { max: 1, prepare: false });

async function migrate() {
  const file = join(process.cwd(), "supabase", "migrations", "0001_init.sql");
  console.log("→ Reading", file);
  const ddl = readFileSync(file, "utf8");
  console.log("→ Executing migration (~10s)…");
  await sql.unsafe(ddl);
  console.log("✓ Migration complete");
  await sql.end();
}

migrate().catch(async (err) => {
  console.error("Migration failed:", err.message);
  await sql.end();
  process.exit(1);
});
