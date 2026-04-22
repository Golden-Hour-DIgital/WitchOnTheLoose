import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/product/ProductGrid";
import Button from "@/components/ui/Button";
import type { Product } from "@/types";

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .neq("status", "hidden")
    .order("created_at", { ascending: false })
    .limit(4);
  return (data as Product[]) ?? [];
}

const categories = [
  {
    href: "/shop/clothing",
    label: "Clothing",
    description: "One-of-one wearable magic",
    emoji: "🧥",
    bg: "bg-burnt/10",
    border: "border-burnt/20",
  },
  {
    href: "/shop/leather",
    label: "Leather Goods",
    description: "Hand-stitched, built to last",
    emoji: "🌿",
    bg: "bg-moss/10",
    border: "border-moss/20",
  },
  {
    href: "/shop/herbals",
    label: "Herbals",
    description: "Potions, salves & botanicals",
    emoji: "🌙",
    bg: "bg-magic/10",
    border: "border-magic/20",
  },
  {
    href: "/shop/vintage",
    label: "Vintage",
    description: "Curated secondhand finds",
    emoji: "✦",
    bg: "bg-gold/10",
    border: "border-gold/30",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="animate-fade-in">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-ink">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/witch-flying.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-black/55 z-10" />

        <div className="container-site py-24 md:py-36 relative z-20">
          <div className="max-w-2xl">
            <p className="font-serif italic text-cream/70 text-lg mb-4 tracking-wide">
              One of a kind. Always.
            </p>
            <h1 className="font-display text-6xl md:text-8xl text-cream leading-tight mb-6">
              Handcrafted Magic
            </h1>
            <p className="font-sans text-cream/80 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              Clothing, leather goods, and herbal products made with intention.
              Each piece is unique — when it&apos;s gone, it&apos;s gone.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg" className="bg-cream text-burnt hover:bg-cream/90 shadow-lg">
                  Shop the Collection
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" size="lg" className="text-cream hover:bg-cream/10 border border-cream/30">
                  Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section className="container-site py-20">
        <div className="text-center mb-12">
          <h2 className="section-heading">Browse by Category</h2>
          <p className="section-subheading">Find your kind of magic</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {categories.map(({ href, label, description, emoji, bg, border }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-2xl border p-8 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${bg} ${border}`}
            >
              <span className="text-5xl">{emoji}</span>
              <h3 className="font-display text-2xl text-burnt">{label}</h3>
              <p className="text-sm text-ink/60 font-serif italic">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured Products ─── */}
      {featured.length > 0 && (
        <section className="bg-moss/5 py-20">
          <div className="container-site">
            <div className="text-center mb-12">
              <h2 className="section-heading">Featured Pieces</h2>
              <p className="section-subheading">Freshly conjured &amp; available now</p>
            </div>
            <ProductGrid products={featured} />
            <div className="text-center mt-10">
              <Link href="/shop">
                <Button variant="secondary" size="lg">View All Products</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── About Preview ─── */}
      <section className="container-site py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl aspect-[4/3] bg-moss/10 flex items-center justify-center overflow-hidden">
            {/* Placeholder — replace with real about photo */}
            <span className="text-moss/30 text-8xl">✦</span>
          </div>
          <div>
            <p className="font-serif italic text-moss text-sm uppercase tracking-widest mb-3">
              The Maker
            </p>
            <h2 className="font-display text-5xl text-burnt mb-5">
              Made with intention, worn with magic
            </h2>
            <p className="font-sans text-ink/70 text-base leading-relaxed mb-4">
              Every piece that leaves this cottage is made by hand, with love, and a little bit of
              magic. I sew, stitch, blend, and bottle each item myself — no factories, no shortcuts.
            </p>
            <p className="font-sans text-ink/70 text-base leading-relaxed mb-8">
              The one-of-one model isn&apos;t a gimmick. It means the piece you hold was made
              for you — even if you didn&apos;t know it yet.
            </p>
            <Link href="/about">
              <Button variant="secondary">Read My Story</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Newsletter / Social CTA ─── */}
      <section className="bg-ink py-16">
        <div className="container-site text-center">
          <h2 className="font-display text-4xl text-cream mb-3">Follow the Magic</h2>
          <p className="font-serif italic text-cream/60 mb-8">
            New pieces drop on Instagram first.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="btn-primary bg-magic hover:bg-magic-600 text-white"
            >
              Instagram
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-cream/20 text-cream hover:bg-cream/10 transition-colors duration-200 font-sans font-semibold text-sm"
            >
              Facebook
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
