import { youtubeVideo, type YouTubeVideo } from "@/lib/youtube";

/**
 * Reading a `:::embed` fence.
 *
 * The fence holds a URL on one line and a caption under it, and nothing in
 * this repo read either. An unstyled fence renders as a card, so the Patkholi
 * gaushala's map arrived as a card containing four hundred characters of
 * Google Maps URL as its own link text - the longest thing on the page, and
 * not a map.
 *
 * Only two kinds are recognised, and anything else becomes a plain captioned
 * link rather than a frame. That is the whole security boundary here: an
 * author's URL never reaches an iframe src unless it is a host this file
 * names.
 */

export type Embed =
  | { kind: "youtube"; video: YouTubeVideo; caption: string; href: string }
  | { kind: "map"; src: string; caption: string; href: string }
  | { kind: "link"; caption: string; href: string };

const MAP_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

/**
 * The point a Google Maps URL is looking at.
 *
 * A place URL carries it twice: `@lat,lng,17z` is where the camera sits, and
 * `!3dlat!4dlng` is the pin. The pin is the better answer - the camera can be
 * anywhere - so it is preferred, with the camera as the fallback.
 */
function coordinates(url: URL): string | null {
  const pin = url.pathname.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (pin) return `${pin[1]},${pin[2]}`;

  const camera = url.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (camera) return `${camera[1]},${camera[2]}`;

  const query = url.searchParams.get("q");
  return query && /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(query.trim()) ? query.trim() : null;
}

/**
 * A map that can be framed, from a link that was meant for a browser.
 *
 * `output=embed` takes a coordinate and nothing else, which is why the
 * coordinates are dug out above rather than the original URL being framed: a
 * place URL carries a session id and a data blob that mean nothing in an
 * iframe, and Google refuses to frame the page a human would see.
 *
 * A short link (maps.app.goo.gl) resolves only by following it, which is a
 * request this cannot make while rendering, so those stay links.
 */
function mapSrc(url: URL): string | null {
  const at = coordinates(url);
  if (!at) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(at)}&z=16&output=embed`;
}

/**
 * The first Google Maps coordinate in a piece of text.
 *
 * Used to describe a gaushala to a search engine. The coordinates are not a
 * field of their own - they sit inside the map link an author pasted into the
 * body - so this reads them back out rather than asking anyone to type them
 * twice and get one of them wrong.
 */
export function mapCoordinates(text: string): { lat: number; lng: number } | null {
  const found = (text ?? "").match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)|@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (!found) return null;

  const lat = Number(found[1] ?? found[3]);
  const lng = Number(found[2] ?? found[4]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
}

export function readEmbed(href: string, caption: string): Embed | null {
  const target = href.trim();
  if (!target) return null;

  const video = youtubeVideo(target);
  if (video) return { kind: "youtube", video, caption, href: target };

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  if (MAP_HOSTS.has(url.hostname) && /maps/.test(url.pathname + url.hostname)) {
    const src = mapSrc(url);
    return src
      ? { kind: "map", src, caption, href: target }
      : { kind: "link", caption, href: target };
  }

  return { kind: "link", caption, href: target };
}

/**
 * The first link in a rendered block, and the words around it.
 *
 * The fence is parsed into HTML long before this runs, so the URL arrives as
 * an anchor. Reading it back out is less pleasant than carrying it through the
 * parser, and much smaller: the parser is shared with five other fence kinds
 * that have no use for it.
 */
export function embedFromHtml(html: string): Embed | null {
  const anchor = html.match(/<a[^>]+href="([^"]+)"[^>]*>/i);
  if (!anchor) return null;

  const text = html
    .replace(/<a[^>]*>[\s\S]*?<\/a>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return readEmbed(decodeHtml(anchor[1]!), text);
}

/** The entities a Markdown renderer puts into an href. */
function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
