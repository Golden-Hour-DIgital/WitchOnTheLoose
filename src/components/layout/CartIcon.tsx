"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative p-2 rounded-full text-ink/70 hover:text-ink hover:bg-moss/10 transition-colors duration-150"
      aria-label={`Shopping cart, ${itemCount} items`}
    >
      <ShoppingBag size={22} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-magic text-white text-[10px] font-bold leading-none">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
