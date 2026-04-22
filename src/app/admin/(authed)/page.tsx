import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [
    { count: availableCount },
    { count: soldCount },
    { count: pendingShipment },
    { count: unreadMessages },
    { data: recentOrders },
    { data: monthOrders },
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .in("status", ["paid", "shipped", "delivered"]),
  ]);

  const revenueMTD = (monthOrders ?? []).reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="section-heading">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Available products" value={availableCount ?? 0} />
        <Stat label="Sold (lifetime)" value={soldCount ?? 0} />
        <Stat label="To ship" value={pendingShipment ?? 0} highlight={(pendingShipment ?? 0) > 0} />
        <Stat label="Unread messages" value={unreadMessages ?? 0} highlight={(unreadMessages ?? 0) > 0} />
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg text-ink mb-3">Revenue this month</h2>
        <p className="font-display text-3xl text-magic">{formatPrice(revenueMTD)}</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-magic hover:underline font-sans">
            View all →
          </Link>
        </div>
        {!recentOrders?.length ? (
          <p className="text-sm text-ink/50 font-serif italic">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-moss/10">
            {recentOrders.map((o) => (
              <li key={o.id} className="py-3 flex justify-between items-center text-sm font-sans">
                <div>
                  <Link href={`/admin/orders/${o.id}`} className="text-ink hover:text-magic">
                    {o.order_number}
                  </Link>
                  <span className="text-ink/50 ml-3">{o.customer_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wide text-ink/40">{o.status}</span>
                  <span className="text-ink">{formatPrice(Number(o.total))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "ring-2 ring-magic/30" : ""}`}>
      <p className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</p>
      <p className="font-display text-3xl text-ink mt-1">{value}</p>
    </div>
  );
}
