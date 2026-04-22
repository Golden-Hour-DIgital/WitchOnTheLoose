"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Package, ShoppingBag, FileText, Mail, LogOut } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: Mail },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 shrink-0 border-r border-moss/10 bg-cream/30 min-h-screen p-4 flex flex-col">
      <div className="font-display text-2xl text-magic mb-8 px-2">Witch Admin</div>
      <nav className="space-y-1 flex-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-sans transition ${
                active ? "bg-magic/10 text-magic" : "text-ink/70 hover:bg-moss/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-moss/10 pt-3 mt-3">
        <p className="text-xs text-ink/40 px-2 pb-2 truncate font-serif italic">{email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-sans text-ink/70 hover:bg-mushroom/10 hover:text-mushroom"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
