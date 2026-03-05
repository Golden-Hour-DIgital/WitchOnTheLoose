import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

const shopLinks = [
  { href: "/shop", label: "All Products" },
  { href: "/shop/clothing", label: "Clothing" },
  { href: "/shop/leather", label: "Leather Goods" },
  { href: "/shop/herbals", label: "Herbals" },
];

const infoLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const policyLinks = [
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/policies/privacy", label: "Privacy Policy" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream/80 mt-20">
      <div className="container-site py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="font-display text-3xl text-cream block mb-3">
              Witch on the Loose
            </Link>
            <p className="text-sm text-cream/50 font-serif italic leading-relaxed">
              One-of-a-kind handmade clothing, leather goods &amp; herbal products.
              Each piece is unique &mdash; when it&apos;s gone, it&apos;s gone.
            </p>
            <div className="flex gap-3 mt-5">
              <a
                href="#"
                aria-label="Instagram"
                className="p-2 rounded-full bg-cream/10 hover:bg-cream/20 transition-colors duration-150"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="p-2 rounded-full bg-cream/10 hover:bg-cream/20 transition-colors duration-150"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-cream text-sm uppercase tracking-widest mb-4">Shop</h4>
            <ul className="space-y-2">
              {shopLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-serif text-cream text-sm uppercase tracking-widest mb-4">Info</h4>
            <ul className="space-y-2">
              {infoLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-serif text-cream text-sm uppercase tracking-widest mb-4">Policies</h4>
            <ul className="space-y-2">
              {policyLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-cream/60 hover:text-cream transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream/40">
            &copy; {new Date().getFullYear()} Witch on the Loose. All rights reserved.
          </p>
          <p className="text-xs text-cream/30 font-serif italic">
            Handcrafted with magic ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
