import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
   title: "Community Events Board",
   description: "Discover and remember local events near you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <header className="border-b border-gray-200 bg-white">
              <nav className="mx-auto max-w-6xl px-4 py-3">
                <span className="text-lg font-bold text-indigo-700">Community Events</span>
              </nav>
            </header>
          }
        >
          <NavBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
