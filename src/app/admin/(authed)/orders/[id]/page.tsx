import { createServiceClient } from "@/lib/supabase/service";
import { formatPrice } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CopyAddressButton } from "@/app/admin/_components/CopyAddressButton";
import { OrderStatusForm } from "@/app/admin/_components/OrderStatusForm";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const o = order as Order;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-ink/50 hover:text-magic">
            ← All orders
          </Link>
          <h1 className="section-heading mt-2">{o.order_number}</h1>
          <p className="text-sm text-ink/50 font-sans">
            {new Date(o.created_at).toLocaleString()} · {o.customer_email}
          </p>
        </div>
        <CopyAddressButton address={o.shipping_address} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-serif text-lg text-ink mb-4">Ship to</h2>
          <address className="not-italic text-sm font-sans text-ink space-y-1">
            <div>{o.shipping_address.name}</div>
            <div>{o.shipping_address.line1}</div>
            {o.shipping_address.line2 && <div>{o.shipping_address.line2}</div>}
            <div>
              {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.zip}
            </div>
            <div>{o.shipping_address.country}</div>
          </address>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg text-ink mb-4">Items</h2>
          <ul className="space-y-2 text-sm font-sans">
            {o.items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-ink">{item.name}</span>
                <span className="text-ink/60">{formatPrice(Number(item.price))}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-moss/10 mt-4 pt-4 space-y-1 text-sm font-sans">
            <Row label="Subtotal" value={formatPrice(Number(o.subtotal))} />
            <Row label="Shipping" value={formatPrice(Number(o.shipping_cost))} />
            <Row label="Tax" value={formatPrice(Number(o.tax))} />
            <Row label="Total" value={formatPrice(Number(o.total))} bold />
          </div>
        </div>
      </div>

      <OrderStatusForm order={o} />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-ink" : "text-ink/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
