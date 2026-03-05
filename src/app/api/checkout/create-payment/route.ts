import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOrderNumber(): string {
  const num = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  return `WOTL-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceId,
      amount,
      items,
      subtotal,
      shipping,
      tax,
      total,
      customerEmail,
      customerName,
      shippingAddress,
    } = body;

    // 1. Process payment with Square
    const squareRes = await fetch(
      `${process.env.SQUARE_API_BASE_URL}/v2/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Square-Version": "2024-01-18",
        },
        body: JSON.stringify({
          source_id: sourceId,
          idempotency_key: crypto.randomUUID(),
          amount_money: {
            amount,
            currency: "USD",
          },
          location_id: process.env.SQUARE_LOCATION_ID,
          buyer_email_address: customerEmail,
        }),
      }
    );

    const squareData = await squareRes.json();

    if (!squareRes.ok || squareData.errors) {
      const msg = squareData.errors?.[0]?.detail ?? "Payment failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const paymentId: string = squareData.payment.id;

    // 2. Create order in Supabase
    const supabase = createClient();
    const orderNumber = generateOrderNumber();

    const { error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_email: customerEmail,
      customer_name: customerName,
      shipping_address: shippingAddress,
      items,
      subtotal,
      shipping_cost: shipping,
      tax,
      total,
      square_payment_id: paymentId,
      status: "paid",
    });

    if (orderError) {
      console.error("Order insert failed:", orderError);
      // Don't fail the request — payment succeeded, investigate manually
    }

    // 3. Mark products as sold
    const productIds = items.map((i: { product_id: string }) => i.product_id);
    await supabase
      .from("products")
      .update({ status: "sold" })
      .in("id", productIds);

    // 4. Send confirmation email
    try {
      await resend.emails.send({
        from: "Witch on the Loose <orders@witchontheloose.com>",
        to: customerEmail,
        subject: `Order Confirmed — ${orderNumber}`,
        html: buildOrderEmail({ orderNumber, customerName, items, subtotal, shipping, tax, total }),
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    return NextResponse.json({ success: true, orderNumber });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildOrderEmail(params: {
  orderNumber: string;
  customerName: string;
  items: { name: string; price: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}): string {
  const { orderNumber, customerName, items, subtotal, shipping, tax, total } = params;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const itemsHtml = items
    .map((i) => `<tr><td>${i.name}</td><td align="right">${fmt(i.price)}</td></tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;">
  <h1 style="color:#C75B28;font-family:Georgia,serif;">Witch on the Loose</h1>
  <p>Hi ${customerName},</p>
  <p>Your order <strong>${orderNumber}</strong> is confirmed! Thank you for supporting handmade magic.</p>
  <table width="100%" cellpadding="8" style="border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#FAF7F2;"><th align="left">Item</th><th align="right">Price</th></tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td>Subtotal</td><td align="right">${fmt(subtotal)}</td></tr>
      <tr><td>Shipping</td><td align="right">${fmt(shipping)}</td></tr>
      <tr><td>Tax</td><td align="right">${fmt(tax)}</td></tr>
      <tr style="font-weight:bold;"><td>Total</td><td align="right">${fmt(total)}</td></tr>
    </tfoot>
  </table>
  <p>Your items will ship within 3–5 business days. You'll receive a tracking number when they're on the way.</p>
  <p style="color:#8B5CF6;font-style:italic;">With magic &amp; care,<br />Witch on the Loose</p>
</body>
</html>`;
}
