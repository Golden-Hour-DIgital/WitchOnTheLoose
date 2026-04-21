import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateTax } from "@/lib/tax";
import { Resend } from "resend";

function generateOrderNumber(): string {
  const num = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
  return `WOTL-${num}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Only these fields are trusted from the client. subtotal/shipping/tax/total/amount
    // are intentionally ignored — the server recomputes them below.
    const {
      sourceId,
      items,
      shippingAddress,
      customerEmail,
      customerName,
    } = body;

    // 1. Validate cart
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (
      typeof sourceId !== "string" || !sourceId ||
      typeof customerEmail !== "string" || !customerEmail ||
      typeof customerName !== "string" || !customerName
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Fetch products from DB (service client bypasses RLS)
    const supabase = createServiceClient();
    const productIds = items.map((i: { product_id: string }) => i.product_id);

    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, slug, price, featured_image, status, is_taxable")
      .in("id", productIds);

    if (pErr || !products || products.length !== items.length) {
      if (pErr) console.error("Product fetch error:", pErr);
      return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
    }

    // 3. Reject if any product is no longer available
    const soldOut = products.find((p) => p.status !== "available");
    if (soldOut) {
      return NextResponse.json(
        { error: `${soldOut.name} has already been sold` },
        { status: 409 }
      );
    }

    // 3b. Validate shipping address before tax computation
    if (!shippingAddress?.state || typeof shippingAddress.state !== "string") {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 });
    }

    // 4. Recompute totals server-side — client-supplied numbers are never used
    const subtotal = products.reduce((sum, p) => sum + Number(p.price), 0);
    const shipping = 8.0;
    const tax = calculateTax(
      products.map((p) => ({ price: Number(p.price), is_taxable: p.is_taxable })),
      shippingAddress.state
    );
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    const amount = Math.round(total * 100); // cents for Square

    // 5. Process payment with Square
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
      console.error("Square error:", squareData.errors);
      const msg = squareData.errors?.[0]?.detail ?? "Payment failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const paymentId: string = squareData.payment.id;

    // 6. Create order in Supabase using server-computed values
    const orderNumber = generateOrderNumber();

    // Build the items JSONB from fetched products, not client data
    const orderItems = products.map((p) => ({
      product_id: p.id,
      name: p.name,
      price: Number(p.price),
      featured_image: p.featured_image,
      slug: p.slug,
    }));

    const { error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_email: customerEmail,
      customer_name: customerName,
      shipping_address: shippingAddress,
      items: orderItems,
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

    // 7. Mark products as sold
    await supabase.from("products").update({ status: "sold" }).in("id", productIds);

    // 8. Send confirmation email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Witch on the Loose <orders@witchontheloose.com>",
        to: customerEmail,
        subject: `Order Confirmed — ${orderNumber}`,
        html: buildOrderEmail({ orderNumber, customerName, items: orderItems, subtotal, shipping, tax, total }),
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
