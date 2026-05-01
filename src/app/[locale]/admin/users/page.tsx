import { requirePermission } from "@/lib/auth-utils";
import { listAdminUsers } from "@/lib/actions/admin";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const ctx = await requirePermission("users");
  const users = await listAdminUsers();
  return <UsersClient users={users} currentUserId={ctx.user.id} />;
}
