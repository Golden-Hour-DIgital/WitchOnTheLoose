"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/clothing", label: "Clothing" },
  { href: "/shop/leather", label: "Leather" },
  { href: "/shop/herbals", label: "Herbals" },
  { href: "/shop/vintage", label: "Vintage" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={clsx("flex items-center gap-1", className)}>
      {navLinks.map(({ href, label }) => {
        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "px-3 py-2 rounded-full text-sm font-medium font-sans transition-colors duration-150",
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
  );
}
