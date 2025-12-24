import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupportFloat } from "./components/SupportFloat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "云秒嗒AI手机下载中心",
  description: "云秒嗒AI手机下载中心 · 探索未来科技 · 体验极致应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased selection:bg-sky-200 selection:text-slate-900`}
      >
        {children}
        <SupportFloat />
      </body>
    </html>
  );
}
