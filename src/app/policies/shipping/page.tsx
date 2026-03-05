import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <div className="container-site py-16 max-w-3xl animate-fade-in">
      <h1 className="section-heading mb-8">Shipping Policy</h1>
      <div className="prose prose-stone font-sans text-ink/80 leading-relaxed space-y-6">
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Processing Time</h2>
          <p>
            All orders are processed within 3–5 business days. Because everything is handmade,
            some items may require additional time. I will contact you if there is any delay.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Shipping Rates</h2>
          <p>Flat rate shipping of <strong>$8.00</strong> applies to all domestic (US) orders.</p>
          <p>International shipping is available — please contact me for rates before ordering.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Tracking</h2>
          <p>
            Once your order ships, you will receive an email with a tracking number.
            Most domestic orders arrive within 5–7 business days after shipment.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Lost or Damaged Packages</h2>
          <p>
            If your package is lost or arrives damaged, please contact me within 7 days of
            the expected delivery date and I will work with you to resolve the issue.
          </p>
        </section>
      </div>
    </div>
  );
}
