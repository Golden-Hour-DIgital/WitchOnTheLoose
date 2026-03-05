"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { clsx } from "clsx";

const navLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop/clothing", label: "Clothing" },
  { href: "/shop/leather", label: "Leather Goods" },
  { href: "/shop/herbals", label: "Herbals" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        className="p-2 rounded-full text-ink/70 hover:text-ink hover:bg-moss/10 transition-colors duration-150 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={clsx(
          "fixed top-0 left-0 z-50 h-full w-72 bg-cream shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-moss/20">
          <span className="font-display text-2xl text-burnt">Witch on the Loose</span>
          <button
            className="p-2 rounded-full hover:bg-moss/10 text-ink/60"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors duration-150",
                  isActive
                    ? "bg-magic/10 text-magic-700"
                    : "text-ink/70 hover:text-ink hover:bg-moss/10"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-8 left-4 right-4">
          <p className="text-center text-xs text-ink/40 font-serif italic">
            Handcrafted with magic ✦
          </p>
        </div>
      </div>
    </>
  );
}
