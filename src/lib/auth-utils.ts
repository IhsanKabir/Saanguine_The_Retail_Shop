import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/en/sign-in");
  return user;
}

/**
 * Admin gate. Reads role from app_metadata.role (set in Supabase dashboard
 * or via service-role key). Owners flip their own user to "admin" once.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/en/sign-in?next=/en/admin");
  const role = (user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "owner") redirect("/en");
  return user;
}
