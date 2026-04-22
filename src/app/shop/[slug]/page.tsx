import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProductGallery from "@/components/product/ProductGallery";
import AddToCartButton from "@/components/product/AddToCartButton";
import Badge from "@/components/ui/Badge";
import ProductGrid from "@/components/product/ProductGrid";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .neq("status", "hidden")
    .single();
  return (data as Product) ?? null;
}

async function getRelated(product: Product): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .neq("status", "hidden")
    .order("created_at", { ascending: false })
    .limit(3);
  return (data as Product[]) ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      images: product.featured_image ? [product.featured_image] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const isSold = product.status === "sold";

  return (
    <div className="container-site py-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Gallery */}
        <div className="relative">
          <ProductGallery
            images={product.images?.length ? product.images : product.featured_image ? [product.featured_image] : []}
            name={product.name}
          />
          {isSold && (
            <div className="absolute top-4 right-4">
              <Badge variant="sold" className="text-sm px-4 py-1.5">SOLD</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.is_one_of_one && (
            <Badge variant="one-of-one" className="mb-4">One of One</Badge>
          )}

          <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="font-sans font-bold text-2xl text-ink">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="font-sans text-lg text-ink/40 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {isSold ? (
            <div className="rounded-xl bg-ink/5 border border-ink/10 px-5 py-4 mb-6">
              <p className="font-serif italic text-ink/60 text-sm">
                This piece has found its home. Browse the shop for what&apos;s currently available.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <AddToCartButton product={product} size="lg" fullWidth />
              <p className="text-xs text-ink/40 text-center mt-2 font-serif italic">
                One of one — when it&apos;s gone, it&apos;s gone.
              </p>
            </div>
          )}

          <div className="prose prose-sm text-ink/70 font-sans leading-relaxed mb-8">
            <p>{product.description}</p>
          </div>

          {/* Details */}
          {(product.materials || product.dimensions || product.care_instructions) && (
            <div className="space-y-3 border-t border-moss/15 pt-6">
              {product.materials && (
                <div>
                  <dt className="text-xs font-medium text-ink/50 uppercase tracking-wider mb-0.5">Materials</dt>
                  <dd className="text-sm text-ink/80 font-sans">{product.materials}</dd>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <dt className="text-xs font-medium text-ink/50 uppercase tracking-wider mb-0.5">Dimensions</dt>
                  <dd className="text-sm text-ink/80 font-sans">{product.dimensions}</dd>
                </div>
              )}
              {product.care_instructions && (
                <div>
                  <dt className="text-xs font-medium text-ink/50 uppercase tracking-wider mb-0.5">Care</dt>
                  <dd className="text-sm text-ink/80 font-sans">{product.care_instructions}</dd>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display text-3xl text-burnt mb-8">You Might Also Love</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
