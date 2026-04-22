"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["paid", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, tracking_number: tracking || null, notes: notes || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="font-serif text-lg text-ink">Fulfillment</h2>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Tracking number</span>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="9400 1000 0000 …"
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Notes (private)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        />
      </label>

      {error && (
        <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">
          {error}
        </div>
      )}

      <Button type="submit" loading={saving}>
        Save
      </Button>
      <p className="text-xs text-ink/40 font-serif italic">
        Setting status to <strong>shipped</strong> with a tracking number will email the customer.
      </p>
    </form>
  );
}
