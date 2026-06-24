import * as Sentry from "@sentry/nextjs";

// Temporary diagnostic log to check if the key is reaching the browser
console.log("Sentry DSN is:", process.env.NEXT_PUBLIC_SENTRY_DSN);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: true,
});

// Temporarily attach Sentry to the browser window for manual local testing [1.2.6]
if (typeof window !== "undefined") {
  (window as any).Sentry = Sentry;
}