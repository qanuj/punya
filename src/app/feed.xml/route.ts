import { feedResponse, rssXml } from "@tintorch/web";
import { getSite } from "@/lib/cms";
import { feedItems } from "@/lib/feed-items";
import { siteName } from "@/lib/site-name";
import { siteOrigin } from "@/lib/sitemap-sources";

/** Everything the blog publishes. Per-tag feeds live at /feed/<tag>.xml. */
export const revalidate = 3600;

export async function GET() {
  const [siteUrl, site, items, name] = await Promise.all([
    siteOrigin(),
    getSite(),
    feedItems(),
    siteName(),
  ]);

  return feedResponse(
    rssXml({
      siteUrl,
      title: name,
      description: site.config.branding?.tagline?.trim() || `Posts from ${name}`,
      feedPath: "/feed.xml",
      items,
    }),
  );
}
