"use client";

import { useState } from "react";
import Image from "next/image";
import { youtubeEmbedUrl, youtubeThumbnail, type YouTubeVideo } from "@/lib/youtube";

/**
 * A video that plays where it sits.
 *
 * The videos were cards with a title and a link out: a visitor who wanted to
 * watch one left the page to do it, and the six on the home page were six
 * links to YouTube dressed as content. They play here now.
 *
 * What loads is the still frame and a play button, not the player. Six
 * embedded iframes is roughly a megabyte of YouTube's JavaScript and six sets
 * of its cookies on a page nobody has asked to watch anything on yet, which
 * this site should not be spending a visitor's connection or their privacy on.
 * Pressing play swaps in the real player, autoplaying, so the click that asked
 * for the video is the click that starts it.
 */
export function VideoEmbed({
  video,
  title,
  className = "",
}: {
  video: YouTubeVideo;
  /** Announced as the frame's name, so the player is not "iframe" to a reader. */
  title: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] ${className}`}
      style={{ aspectRatio: "16 / 9", background: "var(--ink-900, #111)" }}
    >
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(video, true)}
          title={title}
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play video: ${title}`}
        >
          {/*
            * unoptimized: this is YouTube's own still, already sized and cached
            * at their edge, and running it through the image optimizer would
            * mean this site fetching and re-encoding a file it does not own.
            */}
          <Image
            src={youtubeThumbnail(video)}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 92vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* A scrim, so a white play mark holds against a bright frame. */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05))" }}
          />

          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
            style={{ background: "rgba(0,0,0,.65)" }}
          >
            {/* A triangle, drawn rather than imported: one shape is not a font. */}
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
              <path d="M19 11 0 22V0l19 11Z" fill="#fff" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
