/** Single source of truth for site-wide SEO + social metadata. */
export const siteConfig = {
  name: "Dispatch",
  // Public origin of the marketing/dashboard site. Override per environment
  // with NEXT_PUBLIC_SITE_URL; falls back to the production domain.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://dispatch.imtiyazsayyid.in",
  title: "Dispatch — Scheduled webhooks for developers",
  description:
    "POST a URL and a time. Dispatch calls the URL at that moment — with retries, full delivery logs, and no SDK. Open source and self-hostable.",
  tagline: "Scheduled webhooks, fired on time.",
  creator: "Imtiyaz Sayyid",
  keywords: [
    "webhook scheduler",
    "scheduled webhooks",
    "cron alternative",
    "delayed webhooks",
    "task scheduler",
    "job scheduler",
    "webhook automation",
    "open source",
    "self-hostable",
  ],
} as const;
