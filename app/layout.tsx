import "../sentry.client.config"; // Forces browser-side Sentry initialization [2]
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PHProvider } from "../components/PHProvider";
import FeedbackWidget from "../components/FeedbackWidget"; // Import our new floating widget [3]
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading-Analytics-Suite | Private Terminal",
  description: "Advanced multi-timeframe trading analysis and risk management.",
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
          <PHProvider>
            {children}
            {/* Renders the floating feedback widget globally across all views! [3] */}
            <FeedbackWidget /> 
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}