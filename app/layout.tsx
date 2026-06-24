import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PHProvider } from "../components/PHProvider"; // Double check this import path!
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Your professional trading workflow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {/* Wrap the children with our PostHog provider */}
          <PHProvider>
            {children}
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}