import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "../_components/AdminSidebar";

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar email={user.email ?? ""} />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
