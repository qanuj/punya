"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { youtubeEmbedUrl, youtubeThumbnail, type YouTubeVideo } from "@/lib/youtube";

/**
 * Watching the videos without leaving the page.
 *
 * Playing them in the card worked and read badly: a 16:9 player in a third of
 * a row is a postage stamp, and five of them tiling a section is a wall of
 * competing motion. So a card is a still with a play mark, and pressing it
 * opens the video over the page, at the size a video wants, with the rest of
 * the section dimmed behind it.
 *
 * Opened from a card, it is also a slide show: the arrows and the left and
 * right keys move through the videos in the order the section lists them, so
 * somebody who wants to watch the lot does not close and reopen five times.
 *
 * What loads before a click is the still frame, not the player. Six embedded
 * iframes is about a megabyte of YouTube's JavaScript and six sets of its
 * cookies on a page where nobody has asked to watch anything yet.
 */

export type LightboxVideo = {
  video: YouTubeVideo;
  title: string;
};

type Gallery = {
  /** Every video in this section, in the order it is listed. */
  videos: LightboxVideo[];
  open: (at: number) => void;
};

const GalleryContext = createContext<Gallery | null>(null);

/**
 * The videos of one section, and the single dialog they share.
 *
 * One dialog for the section rather than one per card: the point of the slide
 * show is that the videos know about each other, and six dialogs that each
 * contain one video cannot.
 */
export function VideoGallery({
  videos,
  children,
}: {
  videos: LightboxVideo[];
  children: React.ReactNode;
}) {
  const [at, setAt] = useState<number | null>(null);

  const close = useCallback(() => setAt(null), []);
  const step = useCallback(
    (by: number) =>
      setAt((current) =>
        current === null ? current : (current + by + videos.length) % videos.length,
      ),
    [videos.length],
  );

  return (
    <GalleryContext.Provider value={{ videos, open: setAt }}>
      {children}
      {at !== null && (
        <Lightbox
          entry={videos[at]!}
          position={at}
          total={videos.length}
          onClose={close}
          onStep={step}
        />
      )}
    </GalleryContext.Provider>
  );
}

/** The still, and the click that opens it. Falls back to no gallery gracefully. */
export function VideoThumb({
  entry,
  index,
  className = "",
  priority = false,
}: {
  entry: LightboxVideo;
  /** Its place in the section, which is where the slide show starts. */
  index: number;
  className?: string;
  priority?: boolean;
}) {
  const gallery = useContext(GalleryContext);
  const [solo, setSolo] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => (gallery ? gallery.open(index) : setSolo(true))}
        className={`group relative block w-full cursor-pointer overflow-hidden rounded-[var(--radius-md)] ${className}`}
        style={{ aspectRatio: "16 / 9", background: "#111" }}
        aria-haspopup="dialog"
        aria-label={`Play video: ${entry.title}`}
      >
        {/*
          * unoptimized: this is YouTube's own still, already sized and cached
          * at their edge, and running it through the image optimizer would
          * mean this site fetching and re-encoding a file it does not own.
          */}
        <Image
          src={youtubeThumbnail(entry.video)}
          alt=""
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 92vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* A scrim, so a white play mark holds against a bright frame. */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.05))" }}
        />
        <PlayMark />
      </button>

      {/* A thumb outside a gallery still plays, on its own. */}
      {solo && (
        <Lightbox entry={entry} position={0} total={1} onClose={() => setSolo(false)} onStep={() => {}} />
      )}
    </>
  );
}

function PlayMark() {
  return (
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
  );
}

function Lightbox({
  entry,
  position,
  total,
  onClose,
  onStep,
}: {
  entry: LightboxVideo;
  position: number;
  total: number;
  onClose: () => void;
  onStep: (by: number) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  /*
   * Escape closes, the arrows move. Bound to the document rather than to the
   * panel, because the focus is inside YouTube's iframe the moment the video
   * starts and key events there never reach this document at all - the arrows
   * work until you click into the player, which is the honest limit of doing
   * this without their JavaScript API.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (total > 1 && event.key === "ArrowRight") onStep(1);
      if (total > 1 && event.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);

    // The page behind must not scroll under an overlay that covers it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onStep, total]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={entry.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(8,12,24,.88)" }}
      // The backdrop closes; a click inside the panel must not.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panel}
        tabIndex={-1}
        className="w-full max-w-5xl outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className="truncate text-base font-semibold"
              style={{ color: "var(--white, #fff)" }}
            >
              {entry.title}
            </h2>
            {total > 1 && (
              <p className="mt-0.5 text-xs tabular-nums" style={{ color: "rgba(255,255,255,.6)" }}>
                {position + 1} of {total}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="shrink-0 rounded-full p-2 transition-colors hover:bg-white/10"
            style={{ color: "#fff" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-[var(--radius-md)]"
          style={{ aspectRatio: "16 / 9", background: "#000" }}
        >
          <iframe
            // Keyed on the id so stepping swaps the player rather than asking
            // the same iframe to change its src, which leaves the old video
            // audible for a beat.
            key={entry.video.id}
            src={youtubeEmbedUrl(entry.video, true)}
            title={entry.title}
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        {total > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <Step label="Previous video" onClick={() => onStep(-1)} direction="left" />
            <Step label="Next video" onClick={() => onStep(1)} direction="right" />
          </div>
        )}
      </div>
    </div>
  );
}

function Step({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
      style={{ color: "#fff" }}
    >
      {direction === "left" && <Arrow direction="left" />}
      {direction === "left" ? "Previous" : "Next"}
      {direction === "right" && <Arrow direction="right" />}
    </button>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d={direction === "left" ? "M9 1L3 7l6 6" : "M5 1l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
