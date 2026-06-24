"use client";

import "../sentry.client.config"; // Forces browser-side Sentry initialization [2]
import React, { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// Initialize PostHog safely in the browser window on load
if (typeof window !== "undefined") {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // Add these two temporary lines:
  console.log("PostHog API Key is:", apiKey);
  console.log("PostHog API Host is:", apiHost);

  if (apiKey && apiHost) {
    posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: "always",
      capture_pageview: true,
    });
  }
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}