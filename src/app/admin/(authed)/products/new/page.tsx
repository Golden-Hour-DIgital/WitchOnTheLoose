import { ProductForm } from "@/app/admin/_components/ProductForm";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-magic">← All products</Link>
      <h1 className="section-heading">New Product</h1>
      <ProductForm />
    </div>
  );
}
