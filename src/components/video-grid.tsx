import Link from "next/link";
import { VideoGallery, VideoThumb, type LightboxVideo } from "@/components/video-lightbox";
import { field, itemSummary, type CmsItem, type CmsType } from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { youtubeVideo } from "@/lib/youtube";

/**
 * A row of videos that open over the page.
 *
 * One gallery for the row rather than one per card, because the point of it is
 * that the videos know about each other: the arrows and the left and right
 * keys move through them in the order the section lists them, so somebody who
 * wants to watch the lot does not close and reopen five times.
 *
 * An item whose link cannot be read is dropped rather than rendered as a dead
 * frame, which is also what stops an unrecognised URL reaching an iframe src.
 */
export function VideoGrid({ items, type }: { items: CmsItem[]; type: CmsType }) {
  const entries = items.flatMap((item) => {
    const video = youtubeVideo(
      field(item, "embedUrl") || field(item, "url") || field(item, "video"),
    );
    return video ? [{ item, entry: { video, title: item.title } as LightboxVideo }] : [];
  });

  if (entries.length === 0) return null;

  return (
    <VideoGallery videos={entries.map((row) => row.entry)}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((row, at) => (
          <article key={row.item.id} className="flex flex-col gap-3">
            <VideoThumb entry={row.entry} index={at} priority={at === 0} />

            <h3 className="card-title">
              {/* The title still links through: the page behind a video is
                  where its description and its share links live. */}
              <Link href={itemPath(type, row.item.slug)}>{row.item.title}</Link>
            </h3>

            {itemSummary(row.item) && (
              <p
                className="line-clamp-2"
                style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}
              >
                {itemSummary(row.item)}
              </p>
            )}
          </article>
        ))}
      </div>
    </VideoGallery>
  );
}
