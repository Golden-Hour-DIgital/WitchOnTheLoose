import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";
import { sendOrderShipped } from "@/lib/resend";
import type { OrderStatus } from "@/types";

const ALLOWED_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, tracking_number, notes } = body as {
    status?: OrderStatus;
    tracking_number?: string | null;
    notes?: string | null;
  };

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: before, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchErr || !before) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (tracking_number !== undefined) update.tracking_number = tracking_number;
  if (notes !== undefined) update.notes = notes;

  const { error: updErr } = await supabase.from("orders").update(update).eq("id", params.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Fire the shipped email if we just transitioned to shipped AND have a tracking number.
  const justShipped =
    status === "shipped" &&
    before.status !== "shipped" &&
    !!(tracking_number ?? before.tracking_number);

  if (justShipped) {
    try {
      await sendOrderShipped({
        to: before.customer_email,
        orderNumber: before.order_number,
        customerName: before.customer_name,
        trackingNumber: (tracking_number ?? before.tracking_number) as string,
      });
    } catch (e) {
      console.error("Shipped email failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
