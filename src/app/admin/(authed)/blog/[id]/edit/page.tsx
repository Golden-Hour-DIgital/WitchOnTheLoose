import { createServiceClient } from "@/lib/supabase/service";
import { BlogPostForm } from "@/app/admin/_components/BlogPostForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (!data) notFound();
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/blog" className="text-sm text-ink/50 hover:text-magic">← All posts</Link>
      <h1 className="section-heading">{data.title}</h1>
      <BlogPostForm initial={data as BlogPost} postId={id} />
    </div>
  );
}
