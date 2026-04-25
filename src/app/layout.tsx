import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSansTc = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A* Marketplace · 星級頂尖教育平台",
  description: "MVP for Macau tutor-student matching and booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-HK"
      className={`${inter.variable} ${notoSansTc.variable} ${geistMono.variable} h-full bg-[#000225] antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#000225]">{children}</body>
    </html>
  );
}
