"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductStatus } from "@/types";

interface Props {
  id: string;
  name: string;
  status: ProductStatus;
}

export function ProductRowActions({ id, name, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleArchive = async () => {
    const next = status === "hidden" ? "available" : "hidden";
    const verb = next === "hidden" ? "archive" : "unarchive";
    if (!confirm(`${verb === "archive" ? "Hide" : "Unhide"} "${name}" on the public site?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
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
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
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
      <Link
        href={`/admin/products/${id}/edit`}
        className="text-magic hover:underline"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleArchive}
        disabled={busy}
        className="text-ink/60 hover:text-ink disabled:opacity-40"
      >
        {status === "hidden" ? "Unhide" : "Hide"}
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
