import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/product/ProductGrid";
import ShopFilters from "@/components/product/ShopFilters";
import type { Product, ProductCategory, ProductStatus } from "@/types";

interface SearchParams {
  status?: string;
  sort?: string;
  category?: string;
}

async function getProducts(params: SearchParams): Promise<Product[]> {
  const supabase = createClient();

  let query = supabase.from("products").select("*").neq("status", "hidden");

  if (params.status === "available" || params.status === "sold") {
    query = query.eq("status", params.status as ProductStatus);
  }

  if (params.category) {
    query = query.eq("category", params.category as ProductCategory);
  }

  switch (params.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  return (data as Product[]) ?? [];
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const products = await getProducts(searchParams);

  const categoryLabel: Record<string, string> = {
    clothing: "Clothing",
    leather: "Leather Goods",
    herbals: "Herbals",
  };

  const heading = searchParams.category
    ? categoryLabel[searchParams.category] ?? "Shop"
    : "Shop All";

  return (
    <div className="container-site py-12 animate-fade-in">
      <div className="mb-10">
        <h1 className="section-heading">{heading}</h1>
        <p className="section-subheading">
          {products.filter((p) => p.status === "available").length} items available
        </p>
      </div>

      <div className="mb-8">
        <Suspense>
          <ShopFilters showCategoryFilter />
        </Suspense>
      </div>

      <ProductGrid
        products={products}
        emptyMessage="Nothing here yet — check back soon."
      />
    </div>
  );
}
