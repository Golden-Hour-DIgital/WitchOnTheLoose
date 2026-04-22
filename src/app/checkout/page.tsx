"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { calculateTax } from "@/lib/tax";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import type { ShippingAddress } from "@/types";

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>;
        }>;
      }>;
    };
  }
}

const SHIPPING_FLAT = 8.00;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<NonNullable<typeof window.Square>["payments"]>>["card"]>> | null>(null);

  const [form, setForm] = useState<ShippingAddress & { email: string }>({
    email: "",
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const shipping = SHIPPING_FLAT;
  const taxableItems = items.map((i) => ({
    price: i.product.price,
    is_taxable: i.product.is_taxable,
  }));
  const tax = calculateTax(taxableItems, form.state);
  const total = subtotal + shipping + tax;

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Load Square SDK
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!appId || !locationId) return;

    const script = document.createElement("script");
    script.src =
      process.env.NEXT_PUBLIC_SQUARE_ENV === "production"
        ? "https://web.squarecdn.com/v1/square.js"
        : "https://sandbox.web.squarecdn.com/v1/square.js";
    script.onload = async () => {
      try {
        const payments = await window.Square!.payments(appId, locationId);
        const card = await payments.card();
        await card.attach("#sq-card-container");
        cardRef.current = card;
        setSdkReady(true);
      } catch (e) {
        console.error("Square SDK init error", e);
        setError("Payment form failed to load. Please refresh.");
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardRef.current) return;
    setError(null);
    setLoading(true);

    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK" || !result.token) {
        throw new Error(result.errors?.[0]?.message ?? "Payment tokenization failed");
      }

      const res = await fetch("/api/checkout/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          amount: Math.round(total * 100), // cents
          items: items.map((i) => ({
            product_id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            featured_image: i.product.featured_image,
            slug: i.product.slug,
          })),
          subtotal,
          shipping,
          tax,
          total,
          customerEmail: form.email,
          customerName: form.name,
          shippingAddress: {
            name: form.name,
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");

      clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="container-site py-12 animate-fade-in">
      <h1 className="section-heading mb-2">Checkout</h1>
      <p className="section-subheading mb-10">Almost there — fill in your details below.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: shipping + payment */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact */}
            <div className="card p-6">
              <h2 className="font-serif text-lg text-ink mb-5">Contact</h2>
              <input
                name="email"
                type="email"
                placeholder="Email address"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30"
              />
            </div>

            {/* Shipping */}
            <div className="card p-6">
              <h2 className="font-serif text-lg text-ink mb-5">Shipping Address</h2>
              <div className="space-y-3">
                <input name="name" placeholder="Full name" required value={form.name} onChange={handleChange}
                  className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                <input name="line1" placeholder="Street address" required value={form.line1} onChange={handleChange}
                  className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                <input name="line2" placeholder="Apartment, suite, etc. (optional)" value={form.line2 ?? ""} onChange={handleChange}
                  className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input name="city" placeholder="City" required value={form.city} onChange={handleChange}
                    className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                  <input name="state" placeholder="State" required value={form.state} onChange={handleChange}
                    className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                  <input name="zip" placeholder="ZIP code" required value={form.zip} onChange={handleChange}
                    className="col-span-2 sm:col-span-1 border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="font-serif text-lg text-ink mb-5">Payment</h2>
              <div
                id="sq-card-container"
                className="min-h-[100px] border border-moss/20 rounded-xl p-4 bg-white"
              />
              {!sdkReady && (
                <p className="text-xs text-ink/40 mt-2 font-serif italic">Loading secure payment form…</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom font-sans">
                {error}
              </div>
            )}
          </div>

          {/* Right: order summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="font-serif text-lg text-ink mb-5 pb-3 border-b border-moss/10">
                Order Summary
              </h2>
              <div className="space-y-2.5 mb-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm font-sans">
                    <span className="text-ink/70 truncate mr-3">{item.product.name}</span>
                    <span className="text-ink flex-shrink-0">{formatPrice(item.product.price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-moss/10 pt-4 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-ink/60">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Tax (est.)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-moss/10 font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                loading={loading}
                disabled={!sdkReady}
              >
                {loading ? "Processing…" : `Pay ${formatPrice(total)}`}
              </Button>
              <p className="text-center text-xs text-ink/40 mt-3 font-serif italic">
                Secured by Square — we never store your card details.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
