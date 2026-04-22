import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { truncate } from "@/lib/utils";
import type { BlogPost } from "@/types";

export const metadata: Metadata = {
  title: "Blog",
  description: "Updates, stories, and musings from the cottage.",
};

async function getPosts(): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data as BlogPost[]) ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="animate-fade-in">
      <section className="bg-burnt py-20">
        <div className="container-site">
          <p className="font-serif italic text-cream/60 text-sm uppercase tracking-widest mb-3">From the Cottage</p>
          <h1 className="font-display text-6xl md:text-8xl text-cream">Blog</h1>
        </div>
      </section>

      <div className="container-site py-16">
        {posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">✦</p>
            <p className="font-serif italic text-ink/50">Nothing published yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="card group overflow-hidden">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-video overflow-hidden bg-moss/10">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-moss/30 text-4xl">✦</div>
                    )}
                  </div>
                </Link>
                <div className="p-5">
                  {post.published_at && (
                    <p className="text-xs text-ink/40 font-sans mb-2">
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="font-serif text-lg text-ink group-hover:text-burnt transition-colors duration-150 leading-snug mb-2">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-ink/60 font-sans leading-relaxed">
                    {truncate(post.excerpt, 120)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
