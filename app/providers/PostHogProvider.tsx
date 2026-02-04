'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only init if we have an API key and aren't in development (or if we want to test in dev, we can enable it)
    // For now, I'll set up the structure. In a real scenario, we'd want process.env.NEXT_PUBLIC_POSTHOG_KEY
    // I'll add a dummy key or a placeholder logic if env is missing, but best practice is to check env.
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: false // Manual capture for Next.js router events if needed, but 'false' is often safer for SPA to avoid double counting
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
