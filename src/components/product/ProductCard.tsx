"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import AddToCartButton from "./AddToCartButton";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSold = product.status === "sold";

  return (
    <article className="card group">
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden">
        <div className="product-image-wrapper absolute inset-0">
          {product.featured_image ? (
            <Image
              src={product.featured_image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-moss/10 flex items-center justify-center">
              <span className="text-moss/40 text-4xl">✦</span>
            </div>
          )}
        </div>

        {/* Sold overlay */}
        {isSold && (
          <div className="sold-overlay">
            <Badge variant="sold" className="text-sm px-4 py-1.5">SOLD</Badge>
          </div>
        )}

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_one_of_one && (
            <Badge variant="one-of-one">One of One</Badge>
          )}
          {product.compare_at_price && !isSold && (
            <Badge variant="sale">Sale</Badge>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/shop/${product.slug}`} className="block group/title">
          <h3 className="font-serif text-base text-ink leading-snug group-hover/title:text-burnt transition-colors duration-150 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-sans font-semibold text-ink">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="font-sans text-sm text-ink/40 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {!isSold && (
          <div className="mt-3">
            <AddToCartButton product={product} size="sm" />
          </div>
        )}
      </div>
    </article>
  );
}
