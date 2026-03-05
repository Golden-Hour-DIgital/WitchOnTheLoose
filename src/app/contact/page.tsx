import type { Metadata } from "next";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Witch on the Loose.",
};

export default function ContactPage() {
  return (
    <div className="animate-fade-in">
      <section className="bg-burnt py-20">
        <div className="container-site">
          <p className="font-serif italic text-cream/60 text-sm uppercase tracking-widest mb-3">Say Hello</p>
          <h1 className="font-display text-6xl md:text-8xl text-cream">Contact</h1>
        </div>
      </section>

      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-display text-4xl text-burnt mb-4">Let&apos;s Talk</h2>
            <p className="font-sans text-ink/70 leading-relaxed mb-8">
              Questions about an order? Curious about custom work? Just want to say hi?
              Fill out the form and I&apos;ll get back to you within 2–3 business days.
            </p>
            <div className="space-y-4 text-sm font-sans text-ink/60">
              <p className="font-serif italic">
                &ldquo;I read every message myself.&rdquo;
              </p>
              <div className="pt-2 space-y-2">
                <p>Response time: 2–3 business days</p>
                <p>For order issues, please include your order number.</p>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
