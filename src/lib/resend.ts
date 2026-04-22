import { Resend } from "resend";
import { formatPrice } from "@/lib/utils";

const getClient = () => new Resend(process.env.RESEND_API_KEY!);
const FROM = "Witch on the Loose <orders@send.witchontheloose.com>";

interface OrderConfirmationParams {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; price: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export async function sendOrderConfirmation(p: OrderConfirmationParams) {
  const itemsHtml = p.items
    .map((i) => `<tr><td>${escapeHtml(i.name)}</td><td align="right">${formatPrice(i.price)}</td></tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;">
  <h1 style="color:#C75B28;">Witch on the Loose</h1>
  <p>Hi ${escapeHtml(p.customerName)},</p>
  <p>Your order <strong>${p.orderNumber}</strong> is confirmed! Thank you for supporting handmade magic.</p>
  <table width="100%" cellpadding="8" style="border-collapse:collapse;margin:16px 0;">
    <thead><tr style="background:#FAF7F2;"><th align="left">Item</th><th align="right">Price</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td>Subtotal</td><td align="right">${formatPrice(p.subtotal)}</td></tr>
      <tr><td>Shipping</td><td align="right">${formatPrice(p.shipping)}</td></tr>
      <tr><td>Tax</td><td align="right">${formatPrice(p.tax)}</td></tr>
      <tr style="font-weight:bold;"><td>Total</td><td align="right">${formatPrice(p.total)}</td></tr>
    </tfoot>
  </table>
  <p>Your items will ship within 3–5 business days. You'll get a tracking number when they're on the way.</p>
  <p style="color:#8B5CF6;font-style:italic;">With magic &amp; care,<br />Witch on the Loose</p>
</body>
</html>`.trim();

  return getClient().emails.send({
    from: FROM,
    to: p.to,
    subject: `Order Confirmed — ${p.orderNumber}`,
    html,
  });
}

interface OrderShippedParams {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
}

export async function sendOrderShipped(p: OrderShippedParams) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;">
  <h1 style="color:#C75B28;">Witch on the Loose</h1>
  <p>Hi ${escapeHtml(p.customerName)},</p>
  <p>Your order <strong>${p.orderNumber}</strong> is on its way.</p>
  <p style="margin:24px 0;">
    <strong>Tracking:</strong>
    <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(p.trackingNumber)}" style="color:#8B5CF6;">${p.trackingNumber}</a>
  </p>
  <p>Thank you again for supporting handmade magic.</p>
  <p style="color:#8B5CF6;font-style:italic;">With magic &amp; care,<br />Witch on the Loose</p>
</body>
</html>`.trim();

  return getClient().emails.send({
    from: FROM,
    to: p.to,
    subject: `Your order is shipped — ${p.orderNumber}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
