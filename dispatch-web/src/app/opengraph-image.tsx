import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site";

export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social share card (WhatsApp / Twitter / LinkedIn / Slack previews),
 * rendered from code in the Dispatch theme — near-black canvas, amber accent,
 * monospace wordmark. No design asset to maintain.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          padding: "80px",
          backgroundImage:
            "radial-gradient(circle at 75% 15%, rgba(251,191,36,0.12), transparent 45%)",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "#fbbf24",
              marginRight: 18,
            }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: "#e4e4e7",
              letterSpacing: "-0.02em",
            }}
          >
            dispatch
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#fafafa",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Scheduled webhooks,
          </div>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#fbbf24",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            fired on time.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#a1a1aa",
              maxWidth: 760,
              lineHeight: 1.4,
            }}
          >
            POST a URL and a time. We call it at that moment — retries, full
            logs, no SDK. Open source.
          </div>
        </div>

        {/* footer url */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#71717a",
            fontFamily: "monospace",
          }}
        >
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size }
  );
}
