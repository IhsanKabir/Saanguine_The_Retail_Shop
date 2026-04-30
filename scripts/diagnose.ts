import "dotenv/config";
import postgres from "postgres";

const pooled = process.env.DATABASE_URL!;
console.log("→ DATABASE_URL host:", new URL(pooled).hostname);
console.log("→ DATABASE_URL port:", new URL(pooled).port);
console.log("→ DATABASE_URL username (raw):", new URL(pooled).username);

function toDirect(url: string): string {
  const u = new URL(url);
  const username = decodeURIComponent(u.username);
  const project = username.startsWith("postgres.") ? username.slice("postgres.".length) : null;
  if (!project) return url;
  u.username = "postgres";
  u.hostname = `db.${project}.supabase.co`;
  u.port = "5432";
  u.search = "";
  return u.toString();
}

const direct = toDirect(pooled);
console.log("→ derived direct host:", new URL(direct).hostname);
console.log("→ derived direct port:", new URL(direct).port);

console.log("→ connecting…");
const sql = postgres(direct, { max: 1, prepare: false });

(async () => {
  const dbInfo = await sql`select current_database() as db, current_user as usr, inet_server_addr() as ip`;
  console.log("→ connected to:", dbInfo[0]);
  await sql.end();
})().catch(async (e) => {
  console.error("✗ failed:", e.message);
  await sql.end().catch(() => {});
});
