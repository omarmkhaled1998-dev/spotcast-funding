import type { Metadata } from "next";
import { Inter, Cairo, Noto_Kufi_Arabic, Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", weight: ["400", "500", "600", "700", "800"] });
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-noto-kufi", weight: ["400", "500", "600", "700", "800", "900"] });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], variable: "--font-barlow-condensed", weight: ["400", "500", "600", "700", "800", "900"] });
const barlow = Barlow({ subsets: ["latin"], variable: "--font-barlow", weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Shumul Community & Media Hub | شمول",
  description: "Shumul is building a 6-level community and media center in Berqayel, Akkar — broadcast studios, co-working, youth programs, and confidential social services. Net-zero by design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable} ${notoKufi.variable} ${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900" suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
