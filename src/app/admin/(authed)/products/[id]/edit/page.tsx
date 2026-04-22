import { createServiceClient } from "@/lib/supabase/service";
import { ProductForm } from "@/app/admin/_components/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!data) notFound();
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-magic">← All products</Link>
      <h1 className="section-heading">{data.name}</h1>
      <ProductForm initial={data as Product} productId={params.id} />
    </div>
  );
}
