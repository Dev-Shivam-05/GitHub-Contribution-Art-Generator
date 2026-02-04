import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Footer from "@/components/Footer";
import { PostHogProvider } from "@/app/providers/PostHogProvider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Contribution Art Generator | Customize Your Profile Graph",
  description: "Free tool to draw on your GitHub Contribution Graph. Create pixel art, text, and patterns for your GitHub Profile Readme. No generic commits—just art.",
  keywords: [
    "github contribution graph",
    "github profile readme",
    "github pixel art",
    "github activity generator",
    "customize github profile",
    "git art",
    "github cheat sheet"
  ],
  openGraph: {
    title: "GitHub Contribution Art Generator",
    description: "Draw pixel art on your GitHub contribution graph. Free & Open Source.",
    type: "website",
    locale: "en_US",
    siteName: "GitHub Contribution Art",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Contribution Art Generator",
    description: "Draw pixel art on your GitHub contribution graph. Make your profile stand out.",
  },
  verification: {
    google: "FpMq1620MPw97ShOx5JxKpvxsk0ON2uvsx7jUCBk_Ks",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "GitHub Contribution Art",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free tool to draw on your GitHub Contribution Graph. Create pixel art, text, and patterns for your GitHub Profile Readme."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <PostHogProvider>
          <Providers>
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </Providers>
        </PostHogProvider>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
