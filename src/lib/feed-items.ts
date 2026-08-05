import "server-only";
import type { FeedItem } from "@tintorch/web";
import { field, itemImage, itemSummary, listAllItems } from "@/lib/cms";
import type { CmsItem, CmsType } from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { getSite } from "@/lib/cms";

/**
 * The type a feed is built from.
 *
 * A template cannot know which type is the blog, so it asks: the type keyed
 * `blog`, then anything whose path is /blog. A workspace with neither has no
 * feed, which is correct - a feed of pages nobody publishes on a schedule is
 * not a feed anyone wants.
 */
export async function feedType(): Promise<CmsType | null> {
  const site = await getSite();
  return (
    site.types.find((type) => type.key === "blog") ??
    site.types.find((type) => type.path.replace(/\//g, "") === "blog") ??
    null
  );
}

/** Newest first, which is the order a reader shows them in. */
export async function feedItems(): Promise<FeedItem[]> {
  const type = await feedType();
  if (!type) return [];

  const items = await listAllItems(type.key, { revalidate: 3600 });

  return items
    .map((item: CmsItem) => ({
      path: itemPath(type, item.slug),
      title: item.title || item.slug,
      description: itemSummary(item),
      published: item.publishedAt || item.createdAt,
      author: item.authors?.[0]?.name,
      tags: tagsOf(item),
      image: itemImage(item) || undefined,
    }))
    .sort((a, b) => String(b.published ?? "").localeCompare(String(a.published ?? "")));
}

/**
 * Tags, whichever way the type stores them: a list field, or a comma-separated
 * string from a plain text input.
 */
function tagsOf(item: CmsItem): string[] {
  const raw = item.fields?.tags ?? item.fields?.categories;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);

  const text = typeof raw === "string" ? raw : field(item, "tags");
  return text
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
