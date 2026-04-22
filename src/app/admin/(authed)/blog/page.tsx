import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-heading">Blog</h1>
        <Link href="/admin/blog/new"><Button>+ New post</Button></Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-moss/5">
                <td className="py-3 px-4">
                  <Link href={`/admin/blog/${p.id}/edit`} className="text-magic hover:underline">{p.title}</Link>
                </td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{p.status}</td>
                <td className="py-3 px-4 text-right text-ink/50 text-xs">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={3} className="py-10 text-center text-ink/50 font-serif italic">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
