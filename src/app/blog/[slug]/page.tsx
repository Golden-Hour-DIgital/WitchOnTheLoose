import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/types";

interface Props {
  params: { slug: string };
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return (data as BlogPost) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <div className="container-site py-12 animate-fade-in">
      <Link
        href="/blog"
        className="text-sm text-ink/50 hover:text-burnt transition-colors duration-150 font-sans inline-block mb-8"
      >
        ← Back to Blog
      </Link>

      <article className="max-w-2xl mx-auto">
        {post.featured_image && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-8">
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-8">
          {post.published_at && (
            <p className="text-xs text-ink/40 font-sans mb-3">
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          <h1 className="font-display text-5xl text-ink leading-tight mb-4">{post.title}</h1>
          <p className="font-serif italic text-ink/60 text-lg">{post.excerpt}</p>
        </header>

        <div
          className="prose prose-stone max-w-none font-sans leading-relaxed text-ink/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
