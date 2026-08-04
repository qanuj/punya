import type { MetadataRoute } from "next";
import { getSite, listAllItems } from "@/lib/cms";
import { itemPath } from "@/lib/routing";

export const revalidate = 3600;

/**
 * Every URL this site serves, built the same way the router resolves them - so
 * the sitemap cannot list a page that 404s, or miss a type someone added.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const base = (site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  if (!base) return [];

  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, changeFrequency: "daily" }];

  for (const type of site.types) {
    const items = await listAllItems(type.key, { fields: "slug", revalidate: 3600 });
    if (!items.length) continue;

    // A type with a path of its own has a listing page; the root type does not.
    if (type.path.replace(/\//g, "")) {
      entries.push({ url: `${base}${type.path}`, changeFrequency: "weekly" });
    }

    for (const item of items) {
      entries.push({ url: `${base}${itemPath(type, item.slug)}`, changeFrequency: "monthly" });
    }
  }

  return entries;
}
