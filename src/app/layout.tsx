import type { Metadata } from "next";
import { Caveat, EB_Garamond, Nunito } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Witch on the Loose — Handcrafted Magic",
    template: "%s | Witch on the Loose",
  },
  description:
    "One-of-a-kind handmade clothing, leather goods, and herbal products. Each piece is unique — when it's gone, it's gone.",
  keywords: ["handmade", "witchy", "cottage core", "clothing", "leather goods", "herbals", "one of a kind"],
  openGraph: {
    type: "website",
    siteName: "Witch on the Loose",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${caveat.variable} ${ebGaramond.variable} ${nunito.variable}`}>
      <body>
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
