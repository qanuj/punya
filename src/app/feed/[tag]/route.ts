import { feedResponse, feedTags, itemsForTag, rssXml } from "@tintorch/web";
import { feedItems } from "@/lib/feed-items";
import { siteName } from "@/lib/site-name";
import { siteOrigin } from "@/lib/sitemap-sources";

/**
 * One tag's posts.
 *
 * Somebody subscribes to a subject rather than to a publication - a reader
 * following "security" does not want the hiring posts. A tag nothing carries is
 * a 404 rather than an empty channel, which readers show as a broken feed.
 */
export const revalidate = 3600;

/*
 * Rendered on demand rather than at build.
 *
 * Enumerating the tags here meant prerendering seventy feeds on every deploy -
 * seventy of the eighty-three pages the build produced - each one asking the
 * CMS for the site config and the whole post list. That is a lot of consecutive
 * requests over the public internet for files almost nobody fetches, and it is
 * what a deploy failed on: one connection that never opened, in the middle of
 * the seventieth feed.
 *
 * A feed is cached for an hour after the first reader asks for it, which for
 * something a reader polls is the same thing from their side.
 */
export const dynamicParams = true;

export async function GET(_request: Request, { params }: { params: Promise<{ tag: string }> }) {
  const { tag: segment } = await params;
  const slug = segment.replace(/\.xml$/i, "");

  const [siteUrl, all, name] = await Promise.all([siteOrigin(), feedItems(), siteName()]);
  const items = itemsForTag(all, slug);
  if (!items.length) return new Response("Not found", { status: 404 });

  const label = feedTags(all).find((entry) => entry.slug === slug)?.tag ?? slug;

  return feedResponse(
    rssXml({
      siteUrl,
      title: `${name} - ${label}`,
      description: `Posts tagged ${label}`,
      feedPath: `/feed/${slug}.xml`,
      items,
    }),
  );
}
