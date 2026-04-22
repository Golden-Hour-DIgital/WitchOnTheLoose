"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPostStatus } from "@/types";

interface Props {
  id: string;
  title: string;
  status: BlogPostStatus;
  publishedAt: string | null;
}

export function BlogPostRowActions({ id, title, status, publishedAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleToggleStatus = async () => {
    const next: BlogPostStatus = status === "published" ? "draft" : "published";
    const verb = next === "draft" ? "Unpublish" : "Publish";
    if (!confirm(`${verb} "${title}"?`)) return;
    setBusy(true);
    const body: Record<string, unknown> = { status: next };
    if (next === "published" && !publishedAt) {
      body.published_at = new Date().toISOString();
    }
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(`${verb} failed: ${d.error ?? res.statusText}`);
      return;
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(`Delete failed: ${d.error ?? res.statusText}`);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-3 text-xs font-sans">
      <Link href={`/admin/blog/${id}/edit`} className="text-magic hover:underline">
        Edit
      </Link>
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={busy}
        className="text-ink/60 hover:text-ink disabled:opacity-40"
      >
        {status === "published" ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="text-mushroom hover:underline disabled:opacity-40"
      >
        Delete
      </button>
    </div>
  );
}
