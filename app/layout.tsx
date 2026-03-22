import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Analyzer - Indian Stocks",
  description: "AI-powered analysis for Indian stocks (NSE/BSE) with real-time data and intelligent recommendations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950`}>
        {children}
      </body>
    </html>
  );
}
