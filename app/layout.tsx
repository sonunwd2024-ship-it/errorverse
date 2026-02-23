import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ErrorVerse — Master Your Mistakes",
  description: "ErrorVerse is a gamified study tracker for JEE and NEET students. Log errors, track streaks, revise smarter, and level up your study game.",
  keywords: ["JEE study tracker", "NEET error book", "study app", "mistake tracker", "spaced revision", "errorverse"],
  authors: [{ name: "ErrorVerse" }],
  openGraph: {
    title: "ErrorVerse — Master Your Mistakes",
    description: "Gamified study tracker for JEE and NEET students. Log errors, track streaks, and level up.",
    url: "https://errorverse.vercel.app",
    siteName: "ErrorVerse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ErrorVerse — Master Your Mistakes",
    description: "Gamified study tracker for JEE and NEET students.",
  },
  verification: {
    google: "Cq6PJ2fLzBBtdDX28CHF43Jw_Zt6qSUmnsOyaCAB53Q",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}