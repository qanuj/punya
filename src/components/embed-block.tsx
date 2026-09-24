"use client";

import { useState } from "react";
import { VideoThumb } from "@/components/video-lightbox";
import type { Embed } from "@/lib/embeds";

/**
 * What a `:::embed` fence renders as.
 *
 * A map loads on a click rather than on the page, for the same reason the
 * videos do: an iframe here is Google's script and Google's cookies on a page
 * a visitor opened to read about a cow shelter. What they see first is the
 * address they came for and a button, which is also what somebody on a phone
 * outside the gaushala actually wants.
 */
export function EmbedBlock({ embed }: { embed: Embed }) {
  if (embed.kind === "youtube") {
    return (
      <figure className="m-0">
        <VideoThumb entry={{ video: embed.video, title: embed.caption || "Video" }} index={0} />
        {embed.caption && <Caption>{embed.caption}</Caption>}
      </figure>
    );
  }

  if (embed.kind === "map") return <MapEmbed embed={embed} />;

  /*
   * Anything else is a link, never a frame - and a link with words on it. The
   * URL used to be its own label, which on the gaushala page meant four
   * hundred characters of Google Maps query string as the largest text on the
   * screen.
   */
  return (
    <p className="m-0">
      <a href={embed.href} target="_blank" rel="noopener noreferrer">
        {embed.caption || "Open link"} ↗
      </a>
    </p>
  );
}

function MapEmbed({ embed }: { embed: Extract<Embed, { kind: "map" }> }) {
  const [shown, setShown] = useState(false);

  return (
    <figure className="m-0">
      <div
        className="relative w-full overflow-hidden rounded-[var(--radius-md)]"
        style={{ aspectRatio: "16 / 10", background: "var(--surface-card, #f4f1ea)" }}
      >
        {shown ? (
          <iframe
            src={embed.src}
            title={embed.caption || "Map"}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setShown(true)}
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
            style={{ border: "1px solid var(--border-warm, rgba(0,0,0,.08))" }}
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--navy-700, #16305c)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M10 1c-3.3 0-6 2.7-6 6 0 4.5 6 12 6 12s6-7.5 6-12c0-3.3-2.7-6-6-6Zm0 8.2A2.2 2.2 0 1 1 10 4.8a2.2 2.2 0 0 1 0 4.4Z"
                  fill="#fff"
                />
              </svg>
            </span>
            <span className="font-semibold">Show the map</span>
            <span style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
              Loads Google Maps
            </span>
          </button>
        )}
      </div>

      <figcaption
        className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
        style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}
      >
        {embed.caption && <span>{embed.caption}</span>}
        <a href={embed.href} target="_blank" rel="noopener noreferrer" className="font-medium">
          Open in Google Maps ↗
        </a>
      </figcaption>
    </figure>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <figcaption
      className="mt-3"
      style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}
    >
      {children}
    </figcaption>
  );
}
