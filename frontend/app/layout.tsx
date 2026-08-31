import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Plot&Acre | Premium Real Estate & Luxury Living",
  description: "Discover luxury architectural properties, premium villas, and estates with Plot&Acre. Editorial designs, sharp structures, and sophisticated living spaces.",
  keywords: "real estate, luxury villas, architectural homes, premium properties, Plot&Acre",
  icons: {
    icon: '/favicon-updated.jpeg',
    apple: '/favicon-updated.jpeg',
  },
  openGraph: {
    title: "Plot&Acre | Premium Real Estate",
    description: "Discover luxury architectural properties, premium villas, and estates.",
    url: siteUrl,
    siteName: "Plot&Acre",
    images: [
      {
        url: `${siteUrl}/favicon-updated.jpeg`,
        width: 1200,
        height: 630,
        alt: 'Plot&Acre',
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plot&Acre | Premium Real Estate",
    description: "Discover luxury architectural properties, premium villas, and estates.",
    images: [`${siteUrl}/favicon-updated.jpeg`],
  }
};

import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
