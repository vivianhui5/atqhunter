import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ATQ Hunter — Fine Art Collection | Asian Antiques & Artwork",
    template: "%s | ATQ Hunter",
  },
  description: "Explore ATQ Hunter's curated collection of museum-grade Asian artwork and antiques. Over 20 years of carefully selected pieces including paintings, ceramics, and traditional Asian art.",
  keywords: ["Asian art", "antiques", "fine art", "Chinese art", "artwork collection", "museum-grade art", "ATQ Hunter", "Asian antiques", "art gallery", "collectible art"],
  authors: [{ name: "ATQ Hunter" }],
  creator: "ATQ Hunter",
  publisher: "ATQ Hunter",
  metadataBase: new URL("https://atqhunter.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://atqhunter.com",
    siteName: "ATQ Hunter",
    title: "ATQ Hunter — Fine Art Collection | Asian Antiques & Artwork",
    description: "Explore ATQ Hunter's curated collection of museum-grade Asian artwork and antiques. Over 20 years of carefully selected pieces.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ATQ Hunter Fine Art Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ATQ Hunter — Fine Art Collection",
    description: "Explore ATQ Hunter's curated collection of museum-grade Asian artwork and antiques.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-verification-code",
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
        className={`${inter.variable} font-sans antialiased bg-stone-50 text-stone-800`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
