"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";

export default function CartItemRow({ item }: { item: CartItemType }) {
  const { removeItem } = useCart();
  const { product } = item;

  return (
    <div className="flex gap-4 py-4 border-b border-moss/10 last:border-0">
      {/* Thumbnail */}
      <Link href={`/shop/${product.slug}`} className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-moss/10">
          {product.featured_image ? (
            <Image
              src={product.featured_image}
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-moss/30 text-2xl">✦</div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/shop/${product.slug}`}
          className="font-serif text-base text-ink hover:text-burnt transition-colors duration-150 line-clamp-2"
        >
          {product.name}
        </Link>
        <p className="text-xs text-magic/70 mt-0.5">One of One</p>
      </div>

      {/* Price + remove */}
      <div className="flex flex-col items-end justify-between gap-2">
        <span className="font-sans font-semibold text-ink">{formatPrice(product.price)}</span>
        <button
          onClick={() => removeItem(product.id)}
          className="p-1.5 rounded-full text-ink/40 hover:text-mushroom hover:bg-mushroom/10 transition-colors duration-150"
          aria-label={`Remove ${product.name}`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
