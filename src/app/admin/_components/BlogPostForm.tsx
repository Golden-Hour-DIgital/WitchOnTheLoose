"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";
import type { BlogPost, BlogPostStatus } from "@/types";

const STATUSES: BlogPostStatus[] = ["draft", "published"];

interface Values {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  status: BlogPostStatus;
}

const BLANK: Values = { title: "", slug: "", excerpt: "", content: "", featured_image: null, status: "draft" };

export function BlogPostForm({ initial, postId }: { initial?: BlogPost; postId?: string }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(
    initial ? {
      title: initial.title, slug: initial.slug, excerpt: initial.excerpt,
      content: initial.content, featured_image: initial.featured_image, status: initial.status,
    } : BLANK
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const up = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...v,
      published_at: v.status === "published" && !initial?.published_at ? new Date().toISOString() : initial?.published_at ?? null,
    };
    const url = postId ? `/api/admin/blog/${postId}` : "/api/admin/blog";
    const method = postId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    router.push("/admin/blog");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
    router.push("/admin/blog"); router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="card p-6 space-y-4">
        <Field label="Title">
          <input type="text" required value={v.title}
            onChange={(e) => { up("title", e.target.value); if (!postId) up("slug", slugify(e.target.value)); }}
            className={inputCls} />
        </Field>
        <Field label="Slug (URL)">
          <input type="text" required value={v.slug} onChange={(e) => up("slug", slugify(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Excerpt (preview)">
          <textarea rows={2} value={v.excerpt} onChange={(e) => up("excerpt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Content (Markdown)">
          <textarea rows={18} value={v.content} onChange={(e) => up("content", e.target.value)}
            className={`${inputCls} font-mono`} placeholder="## Heading&#10;&#10;Write your story here…" />
        </Field>
        <Field label="Status">
          <select value={v.status} onChange={(e) => up("status", e.target.value as BlogPostStatus)} className={inputCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="card p-6">
        <label className="text-xs uppercase tracking-wider text-ink/50 font-sans block mb-3">Featured image</label>
        <ImageUploader
          value={v.featured_image ? [v.featured_image] : []}
          onChange={(imgs) => up("featured_image", imgs[0] ?? null)}
          max={1}
        />
      </div>

      {error && <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">{error}</div>}

      <div className="flex justify-between">
        <Button type="submit" loading={saving}>{postId ? "Save changes" : "Create post"}</Button>
        {postId && <button type="button" onClick={handleDelete} className="text-sm text-mushroom hover:underline font-sans">Delete</button>}
      </div>
    </form>
  );
}

const inputCls = "w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</span><div className="mt-1">{children}</div></label>);
}
function slugify(s: string): string { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
