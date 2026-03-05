import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Exchanges" };

export default function ReturnsPolicyPage() {
  return (
    <div className="container-site py-16 max-w-3xl animate-fade-in">
      <h1 className="section-heading mb-8">Returns & Exchanges</h1>
      <div className="prose prose-stone font-sans text-ink/80 leading-relaxed space-y-6">
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">One-of-One Items</h2>
          <p>
            Because every item is unique and one-of-a-kind, <strong>all sales are final</strong>
            for handmade clothing and leather goods. Please review product descriptions,
            dimensions, and photos carefully before purchasing.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Herbal Products</h2>
          <p>
            Due to the nature of herbal and consumable products, all sales are final.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Damaged or Incorrect Items</h2>
          <p>
            If you receive a damaged or incorrect item, please contact me within 7 days of
            delivery with photos and a description. I will make it right — either with a
            replacement, store credit, or refund at my discretion.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Contact</h2>
          <p>
            For any issues, reach out through the <a href="/contact" className="text-burnt underline">contact form</a>.
            Please include your order number.
          </p>
        </section>
      </div>
    </div>
  );
}
