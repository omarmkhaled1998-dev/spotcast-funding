import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Toaster } from "sonner";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "SuperMarket POS",
  description: "نظام نقاط البيع للسوبرماركت",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <LanguageProvider>
          <div className="flex h-screen overflow-hidden bg-slate-100">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <Toaster position="top-center" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}
