import type { Metadata } from "next";
import localFont from "next/font/local";

import { AuthProvider } from "@/components/auth/auth-provider";
import { SiteNav } from "@/components/site-nav";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JBGIT",
  description: "连接全球开发者，让技能创造价值",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.className} antialiased`}>
        <AuthProvider>
          <SiteNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
