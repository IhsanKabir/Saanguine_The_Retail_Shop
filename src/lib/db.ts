import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Single connection per Lambda for serverless. Increase max for dev.
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  prepare: false, // required for Supabase pooler
});

export const db = drizzle(client, { schema });
export { schema };
