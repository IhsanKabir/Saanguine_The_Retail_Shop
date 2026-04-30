import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth-utils";
import { signOut } from "@/lib/actions/auth";
import Icon from "@/components/storefront/Icon";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireAdmin();

  const nav = [
    { id: "/admin", name: "Dashboard", icon: "feather" },
    { id: "/admin/orders", name: "Orders", icon: "bag" },
    { id: "/admin/products", name: "Products", icon: "feather" },
    { id: "/admin/segments", name: "Segments", icon: "feather" },
    { id: "/admin/editorial", name: "Editorial", icon: "feather" },
  ];

  return (
    <div className="admin-body">
      <aside className="admin-side">
        <div className="admin-logo">Saanguine<small>ADMIN · v3.0</small></div>
        <div className="admin-nav-group">Commerce</div>
        {nav.map((n) => (
          <Link key={n.id} href={n.id as never} className="admin-link">
            <Icon name={n.icon} size={16} /> <span>{n.name}</span>
          </Link>
        ))}
        <div style={{ marginTop: "auto", padding: "12px", borderTop: "1px solid var(--purple-900)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, color: "var(--purple-200)", letterSpacing: ".1em", textTransform: "uppercase" }}>{user.email}</div>
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ width: "100%", borderColor: "var(--purple-700)", color: "var(--purple-200)" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="crumb">Admin</div>
          <Link href="/" className="icon-btn"><Icon name="x" size={16} /></Link>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
