"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import CartItemRow from "@/components/cart/CartItem";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

const SHIPPING_FLAT = 8.00; // flat rate shipping

export default function CartPage() {
  const { items, subtotal, clearCart } = useCart();
  const isEmpty = items.length === 0;
  const shipping = isEmpty ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  return (
    <div className="container-site py-12 animate-fade-in">
      <h1 className="section-heading mb-2">Your Cart</h1>

      {isEmpty ? (
        <div className="py-24 text-center">
          <p className="text-6xl mb-6">✦</p>
          <p className="font-serif italic text-ink/50 text-lg mb-8">
            Your cart is empty. Time to find something magical.
          </p>
          <Link href="/shop">
            <Button>Browse the Shop</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Link href="/shop" className="text-sm text-ink/50 hover:text-burnt transition-colors duration-150 font-sans">
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-sm text-mushroom/70 hover:text-mushroom transition-colors duration-150 font-sans"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-serif text-lg text-ink mb-5 pb-3 border-b border-moss/10">
                Order Summary
              </h2>
              <div className="space-y-3 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-ink/60">Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                  <span className="text-ink">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Shipping</span>
                  <span className="text-ink">{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-moss/10 font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>
                <p className="text-center text-xs text-ink/40 mt-3 font-serif italic">
                  Secure checkout via Square
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
