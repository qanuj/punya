/**
 * Reading a YouTube link.
 *
 * The CMS stores whatever an editor pasted, and what an editor pastes is
 * whichever URL the browser was showing: a watch link from the desktop site, a
 * youtu.be link from the share sheet, a /shorts/ link from a phone, an /embed/
 * link from somebody who had already found the embed code. All four name the
 * same video, so all four are read here rather than at the point of rendering.
 *
 * A link this cannot read returns null and the caller shows nothing. That is
 * deliberate: the alternative is putting an unrecognised URL into an iframe
 * src, which is how a content field becomes a way to frame any page at all.
 */

/** Eleven characters of [A-Za-z0-9_-], which is what a video id is. */
const ID = /^[A-Za-z0-9_-]{11}$/;

const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

export type YouTubeVideo = {
  id: string;
  /** Seconds into the video to begin, when the link asked for one. */
  start: number;
};

/** `1h2m3s`, `90s` and `90` are all ways a YouTube link states a time. */
function seconds(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);

  const parts = value.match(/(\d+)\s*([hms])/gi);
  if (!parts) return 0;

  return parts.reduce((total, part) => {
    const amount = Number(part.replace(/\D/g, ""));
    const unit = part.trim().slice(-1).toLowerCase();
    return total + amount * (unit === "h" ? 3600 : unit === "m" ? 60 : 1);
  }, 0);
}

export function youtubeVideo(value: string | null | undefined): YouTubeVideo | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  // A bare id, which is what a "YouTube ID" field would hold.
  if (ID.test(raw)) return { id: raw, start: 0 };

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!HOSTS.has(url.hostname)) return null;

  const start = seconds(url.searchParams.get("t") ?? url.searchParams.get("start"));

  // youtu.be/<id>
  if (url.hostname.endsWith("youtu.be")) {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return ID.test(id) ? { id, start } : null;
  }

  // youtube.com/watch?v=<id>
  const query = url.searchParams.get("v");
  if (query && ID.test(query)) return { id: query, start };

  // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
  const [section, id] = url.pathname.replace(/^\/+/, "").split("/");
  if (section && id && ["embed", "shorts", "live", "v"].includes(section) && ID.test(id)) {
    return { id, start };
  }

  return null;
}

/**
 * The player URL.
 *
 * youtube-nocookie.com because a video on a charity's home page should not set
 * an advertising cookie on a visitor who has not pressed play, and `rel=0`
 * because the grid of unrelated videos YouTube shows at the end is not
 * something this site wants to recommend.
 */
export function youtubeEmbedUrl(video: YouTubeVideo, autoplay = false): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  if (video.start > 0) params.set("start", String(video.start));
  return `https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`;
}

/**
 * The still frame.
 *
 * `hqdefault` rather than `maxresdefault`: every video has one, where the
 * maximum-resolution file is missing for anything not uploaded in HD and
 * answers 404, which renders as a broken picture rather than a poster.
 */
export function youtubeThumbnail(video: YouTubeVideo): string {
  return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
}

/** Where the video lives on YouTube, for a link out. */
export function youtubeWatchUrl(video: YouTubeVideo): string {
  const at = video.start > 0 ? `&t=${video.start}` : "";
  return `https://www.youtube.com/watch?v=${video.id}${at}`;
}
