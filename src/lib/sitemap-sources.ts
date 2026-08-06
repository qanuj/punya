import "server-only";
import type { SitemapSource, SitemapUrl } from "@tintorch/web";
import { getSite, listAllItems } from "@/lib/cms";
import { itemPath } from "@/lib/routing";

/**
 * What this site publishes, as sitemap sections.
 *
 * One section per content type, built from the CMS rather than from a list
 * here: a type added in the workspace gets a sitemap without a deploy, which is
 * the same promise the router already makes. The building and the XML are
 * shared - see @tintorch/web - and this only says what the sections are.
 */

/** Fields a sitemap needs. Narrowed, or a listing is too big to cache. */
const FIELDS = "slug";

export async function sitemapSources(): Promise<SitemapSource[]> {
  const site = await getSite();

  return site.types.map((type) => ({
    key: type.key,
    list: async (): Promise<SitemapUrl[]> => {
      const items = await listAllItems(type.key, { fields: FIELDS, revalidate: 3600 });
      if (!items.length) return [];

      const urls: SitemapUrl[] = [];

      /*
       * The type that owns the root has no listing page of its own - "/" is an
       * item, not an index - so only a type with a path contributes one.
       */
      const prefix = type.path.replace(/\//g, "");
      if (prefix) urls.push({ path: type.path });

      for (const item of items) {
        urls.push({ path: itemPath(type, item.slug), lastModified: item.updatedAt });
      }

      return urls;
    },
  }));
}

/** Where this site is served from, as the CMS records it. */
export async function siteOrigin(): Promise<string> {
  const site = await getSite();
  return (site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
}
