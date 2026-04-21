"use client";

import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import Button from "@/components/ui/Button";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Product;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function AddToCartButton({ product, size = "md", fullWidth }: AddToCartButtonProps) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);

  const handleAdd = () => {
    addItem({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        featured_image: product.featured_image,
        status: product.status,
        is_taxable: product.is_taxable,
      },
    });
  };

  if (inCart) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={fullWidth ? "w-full" : undefined}
        disabled
      >
        <Check size={15} />
        In Cart
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      className={fullWidth ? "w-full" : undefined}
      onClick={handleAdd}
    >
      <ShoppingBag size={15} />
      Add to Cart
    </Button>
  );
}
