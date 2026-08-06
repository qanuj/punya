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
export const dynamicParams = true;

export async function generateStaticParams() {
  return feedTags(await feedItems()).map((tag) => ({ tag: `${tag.slug}.xml` }));
}

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
