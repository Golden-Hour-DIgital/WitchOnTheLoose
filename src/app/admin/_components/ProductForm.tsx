"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";
import type { Product, ProductCategory, ProductStatus } from "@/types";

const CATEGORIES: ProductCategory[] = ["clothing", "leather", "herbals", "vintage"];
const STATUSES: ProductStatus[] = ["available", "sold", "hidden"];

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: ProductCategory;
  images: string[];
  status: ProductStatus;
  is_one_of_one: boolean;
  is_featured: boolean;
  is_taxable: boolean;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
}

const BLANK: ProductFormValues = {
  name: "", slug: "", description: "", price: 0, compare_at_price: null,
  category: "clothing", images: [], status: "available",
  is_one_of_one: true, is_featured: false, is_taxable: false,
  materials: null, dimensions: null, care_instructions: null,
};

export function ProductForm({ initial, productId }: { initial?: Product; productId?: string }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(
    initial ? pickValues(initial) : BLANK
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const featured = v.images[0] ?? "";
    const payload = { ...v, featured_image: featured };

    const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = productId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Delete failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="card p-6 space-y-4">
        <Field label="Name">
          <input type="text" required value={v.name}
            onChange={(e) => {
              update("name", e.target.value);
              if (!productId) update("slug", slugify(e.target.value));
            }}
            className={inputCls} />
        </Field>
        <Field label="Slug (URL)">
          <input type="text" required value={v.slug}
            onChange={(e) => update("slug", slugify(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea rows={5} value={v.description}
            onChange={(e) => update("description", e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)">
            <input type="number" step="0.01" min="0" required value={v.price}
              onChange={(e) => update("price", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Compare-at price (optional)">
            <input type="number" step="0.01" min="0"
              value={v.compare_at_price ?? ""}
              onChange={(e) => update("compare_at_price", e.target.value ? Number(e.target.value) : null)}
              className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={v.category} onChange={(e) => update("category", e.target.value as ProductCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={v.status} onChange={(e) => update("status", e.target.value as ProductStatus)} className={inputCls}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <label className="text-xs uppercase tracking-wider text-ink/50 font-sans block mb-3">
          Images
        </label>
        <ImageUploader value={v.images} onChange={(imgs) => update("images", imgs)} />
      </div>

      <div className="card p-6 space-y-3">
        <Check label="One of one" value={v.is_one_of_one} onChange={(x) => update("is_one_of_one", x)} />
        <Check label="Featured on home page" value={v.is_featured} onChange={(x) => update("is_featured", x)} />
        <Check
          label="Taxable in PA"
          help="Leather accessories, jewelry, cosmetics: yes. Clothing, vintage clothing: no."
          value={v.is_taxable}
          onChange={(x) => update("is_taxable", x)}
        />
      </div>

      <div className="card p-6 space-y-4">
        <Field label="Materials"><input type="text" value={v.materials ?? ""} onChange={(e) => update("materials", e.target.value || null)} className={inputCls} /></Field>
        <Field label="Dimensions"><input type="text" value={v.dimensions ?? ""} onChange={(e) => update("dimensions", e.target.value || null)} className={inputCls} /></Field>
        <Field label="Care instructions"><textarea rows={2} value={v.care_instructions ?? ""} onChange={(e) => update("care_instructions", e.target.value || null)} className={inputCls} /></Field>
      </div>

      {error && <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">{error}</div>}

      <div className="flex justify-between">
        <Button type="submit" loading={saving}>{productId ? "Save changes" : "Create product"}</Button>
        {productId && (
          <button type="button" onClick={handleDelete}
            className="text-sm text-mushroom hover:underline font-sans">Delete</button>
        )}
      </div>
    </form>
  );
}

const inputCls = "w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Check({ label, value, onChange, help }: { label: string; value: boolean; onChange: (b: boolean) => void; help?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-magic" />
      <div>
        <div className="text-sm font-sans text-ink">{label}</div>
        {help && <div className="text-xs text-ink/40 font-serif italic mt-0.5">{help}</div>}
      </div>
    </label>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pickValues(p: Product): ProductFormValues {
  return {
    name: p.name, slug: p.slug, description: p.description, price: Number(p.price),
    compare_at_price: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
    category: p.category, images: p.images ?? [], status: p.status,
    is_one_of_one: p.is_one_of_one, is_featured: p.is_featured, is_taxable: p.is_taxable,
    materials: p.materials, dimensions: p.dimensions, care_instructions: p.care_instructions,
  };
}
