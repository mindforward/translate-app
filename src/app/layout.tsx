import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_VERSION } from "@/lib/version";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "譯橋 - 越中翻譯",
  description: "越南文 ↔ 繁體中文 語音翻譯 App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <main className="flex-1">
          {children}
        </main>
        <footer className="text-center text-gray-400 text-[11px] py-3">
          {APP_VERSION} · 譯橋 · Powered by DeepSeek
        </footer>
      </body>
    </html>
  );
}
