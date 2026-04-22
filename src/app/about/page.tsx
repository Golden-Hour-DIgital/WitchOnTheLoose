import type { Metadata } from "next";
import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Witch on the Loose — handmade with intention.",
};

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-burnt py-20">
        <div className="container-site">
          <p className="font-serif italic text-cream/60 text-sm uppercase tracking-widest mb-3">The Story</p>
          <h1 className="font-display text-6xl md:text-8xl text-cream">About</h1>
        </div>
      </section>

      {/* Main content */}
      <div className="container-site py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* TODO(client): replace star placeholder with <Image src="/images/about-founder.jpg" fill /> once client sends headshot */}
          <div className="rounded-2xl aspect-[4/5] bg-moss/10 flex items-center justify-center sticky top-24">
            <span className="text-moss/30 text-8xl">✦</span>
          </div>

          {/* Story */}
          <div className="space-y-6 font-sans text-ink/80 leading-relaxed">
            {/* TODO(client): replace [Name] with client's actual name */}
            <h2 className="font-display text-4xl text-burnt">Hi, I&apos;m [Name]</h2>
            <p>
              I started Witch on the Loose because I couldn&apos;t find the things I wanted to wear
              and hold in the world. Everything felt mass-produced, hollow — stripped of the care
              and intention that makes an object feel alive.
            </p>
            <p>
              So I learned to sew. Then to work leather. Then to grow and blend herbs into
              remedies my grandmother would recognize. Each skill felt like a small act of
              defiance against a world that had forgotten how things were made.
            </p>
            <blockquote className="border-l-4 border-magic pl-6 py-2 my-8">
              <p className="font-serif italic text-xl text-ink/70">
                &ldquo;Everything I make is one of one. Not as a marketing strategy —
                because I simply don&apos;t have the heart to make the same thing twice.&rdquo;
              </p>
            </blockquote>
            <p>
              The one-of-one model means that when you wear something from this shop,
              you are the only person in the world wearing it. That piece was made for
              you — even if I didn&apos;t know it yet.
            </p>
            <p>
              I work out of a small cottage studio surrounded by herbs, fabric scraps,
              and the occasional curious cat. Everything ships from my hands to yours.
            </p>

            <div className="pt-4">
              <Link href="/shop">
                <Button>Shop the Collection</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <section className="bg-moss/5 py-16">
        <div className="container-site">
          <h2 className="section-heading text-center mb-12">What I Believe In</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: "✦",
                title: "One of One",
                body: "Every piece is unique. No patterns repeated, no batches. When it&apos;s gone, it&apos;s gone.",
              },
              {
                icon: "🌿",
                title: "Handmade Honestly",
                body: "I make everything myself. No outsourcing, no factories — just me, my tools, and my hands.",
              },
              {
                icon: "🌙",
                title: "Made with Intention",
                body: "Every stitch and blend is intentional. Each piece carries the energy of the making.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="text-center p-6">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-display text-2xl text-burnt mb-2">{title}</h3>
                <p
                  className="text-ink/60 font-serif italic text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
