import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/authContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "I Siri Properties | Premium Real Estate & Luxury Living",
  description: "Discover luxury architectural properties, premium villas, and estates with I Siri Properties. Editorial designs, sharp structures, and sophisticated living spaces.",
  keywords: "real estate, luxury villas, architectural homes, premium properties, I Siri Properties",
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
