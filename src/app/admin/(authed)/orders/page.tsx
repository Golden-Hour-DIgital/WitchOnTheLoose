import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const supabase = createServiceClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (sp.status && sp.status !== "all") {
    query = query.eq("status", sp.status);
  }
  const { data: orders } = await query;

  const statuses = ["all", "paid", "shipped", "delivered", "cancelled"];
  const active = sp.status ?? "all";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-heading">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-sans ${
              active === s ? "bg-magic text-white" : "bg-white border border-moss/20 text-ink/60 hover:bg-moss/5"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Order</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Tracking</th>
              <th className="text-right py-3 px-4">Total</th>
              <th className="text-right py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-moss/5">
                <td className="py-3 px-4">
                  <Link href={`/admin/orders/${o.id}`} className="text-magic hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="py-3 px-4 text-ink">{o.customer_name}</td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{o.status}</td>
                <td className="py-3 px-4 text-ink/70">{o.tracking_number ?? "—"}</td>
                <td className="py-3 px-4 text-right text-ink">{formatPrice(Number(o.total))}</td>
                <td className="py-3 px-4 text-right text-ink/50 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink/50 font-serif italic">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
