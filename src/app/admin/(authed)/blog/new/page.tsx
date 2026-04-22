import { BlogPostForm } from "@/app/admin/_components/BlogPostForm";
import Link from "next/link";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/blog" className="text-sm text-ink/50 hover:text-magic">← All posts</Link>
      <h1 className="section-heading">New Post</h1>
      <BlogPostForm />
    </div>
  );
}
