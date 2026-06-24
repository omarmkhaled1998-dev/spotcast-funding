"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Tag,
  ReceiptText,
  BarChart3,
  Store,
} from "lucide-react";
import { useLang } from "@/lib/language-context";

const navItems = [
  { href: "/pos", icon: ShoppingCart, key: "pos" },
  { href: "/products", icon: Package, key: "products" },
  { href: "/categories", icon: Tag, key: "categories" },
  { href: "/sales", icon: ReceiptText, key: "sales" },
  { href: "/reports", icon: BarChart3, key: "reports" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { tr, lang, setLang } = useLang();

  return (
    <aside className="w-[220px] bg-slate-900 text-white flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Store size={22} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">{tr.storeName}</div>
            <div className="text-xs text-slate-400">{tr.storeTagline}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href || (href !== "/pos" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{tr[key]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex rounded-lg overflow-hidden border border-slate-600 text-xs">
          <button
            onClick={() => setLang("ar")}
            className={`flex-1 py-1.5 font-medium transition-colors ${
              lang === "ar"
                ? "bg-green-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            العربية
          </button>
          <button
            onClick={() => setLang("en")}
            className={`flex-1 py-1.5 font-medium transition-colors ${
              lang === "en"
                ? "bg-green-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            English
          </button>
        </div>
      </div>
    </aside>
  );
}
