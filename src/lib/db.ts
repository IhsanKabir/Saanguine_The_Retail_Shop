import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Force-load .env over any system env var (Windows boxes often have a
// stale DATABASE_URL pointing at a local Postgres install).
// Skipped in production (Vercel sets env via dashboard, no .env file).
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try { require("dotenv").config({ override: true }); } catch { /* dotenv not installed in prod */ }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * Convert a Supabase Transaction-pooler URL (port 6543, "?pgbouncer=true")
 * into a Session-pooler URL (port 5432, no pgbouncer flag).
 *
 * Why: the Transaction pooler (6543) doesn't keep a connection per query —
 * it multiplexes via PgBouncer transaction mode, which doesn't support
 * prepared statements and has aggressive statement timeouts that kill
 * Drizzle's introspection queries during dev.
 *
 * The Session pooler (5432) gives each client a dedicated connection,
 * supports prepared statements, and has no surprise timeouts. Slightly
 * less efficient at very high concurrency, but the only sane choice
 * for dev + small-scale prod.
 */
function toSessionPooler(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (u.port === "6543") u.port = "5432";
    u.search = ""; // strip ?pgbouncer=true
    return u.toString();
  } catch {
    return rawUrl;
  }
}

const URL_TO_USE = toSessionPooler(process.env.DATABASE_URL);

// Cache the postgres client across Next.js dev hot-reloads. Without this,
// every code change spawns a new client and the old one keeps its TCP
// connection open, eventually exhausting Supabase's connection limit.
type GlobalWithPg = typeof globalThis & { __ssg_pg?: ReturnType<typeof postgres> };
const globalWithPg = globalThis as GlobalWithPg;

const client =
  globalWithPg.__ssg_pg ??
  postgres(URL_TO_USE, {
    max: 10,            // Session pooler can hold multiple connections
    idle_timeout: 30,   // Close idle connections after 30s
    connect_timeout: 10,
    prepare: true,      // Session pooler supports prepared statements
  });

if (process.env.NODE_ENV !== "production") {
  globalWithPg.__ssg_pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
