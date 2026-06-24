import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Wrap your Next.js TypeScript config with Sentry to enable compilation error-tracking
export default withSentryConfig(nextConfig);