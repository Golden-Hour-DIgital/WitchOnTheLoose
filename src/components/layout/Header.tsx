import Link from "next/link";
import Navigation from "./Navigation";
import CartIcon from "./CartIcon";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-moss/15 shadow-sm">
      <div className="container-site">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu trigger */}
          <MobileMenu />

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 font-display text-2xl sm:text-3xl text-burnt hover:text-burnt-600 transition-colors duration-150"
          >
            Witch on the Loose
          </Link>

          {/* Desktop nav */}
          <Navigation className="hidden lg:flex" />

          {/* Cart */}
          <div className="flex items-center gap-2">
            <CartIcon />
          </div>
        </div>
      </div>
    </header>
  );
}
