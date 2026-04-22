import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-heading">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ New product</Button>
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Image</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Taxable?</th>
              <th className="text-right py-3 px-4">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-moss/5">
                <td className="py-2 px-4">
                  {p.featured_image ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image src={p.featured_image} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-moss/10" />
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-magic hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="py-3 px-4 capitalize text-ink/70">{p.category}</td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{p.status}</td>
                <td className="py-3 px-4 text-ink/70">{p.is_taxable ? "Yes" : "No"}</td>
                <td className="py-3 px-4 text-right text-ink">{formatPrice(Number(p.price))}</td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink/50 font-serif italic">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
