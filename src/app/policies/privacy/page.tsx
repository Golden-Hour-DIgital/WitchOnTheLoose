import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="container-site py-16 max-w-3xl animate-fade-in">
      <h1 className="section-heading mb-8">Privacy Policy</h1>
      <div className="prose prose-stone font-sans text-ink/80 leading-relaxed space-y-6">
        <p className="text-sm text-ink/50">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}</p>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Information We Collect</h2>
          <p>
            When you place an order, we collect your name, email address, shipping address,
            and payment information. Payment details are processed securely by Square and are
            never stored on our servers.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To fulfill and ship your order</li>
            <li>To send order confirmation and shipping notifications</li>
            <li>To respond to your inquiries</li>
          </ul>
          <p className="mt-3">
            We do not sell, trade, or share your personal information with third parties
            except as necessary to process payments and fulfill orders.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Cookies</h2>
          <p>
            We use minimal cookies to maintain your shopping cart across sessions.
            No third-party tracking cookies are used.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-ink mb-3">Contact</h2>
          <p>
            For privacy-related questions, please use the{" "}
            <a href="/contact" className="text-burnt underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
