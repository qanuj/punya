import { getSite, type CmsSite, type CmsType } from "@/lib/cms";

/**
 * What a URL means, worked out from the CMS rather than from this codebase.
 *
 * The CMS says which types exist and what path each publishes under - "/" for
 * the type that owns the root, "/blog" and the like for the rest - so a site
 * built on this template gains a section the moment a type is added, without
 * a route file or a deploy.
 *
 * Four shapes, and nothing else:
 *
 *   /                        the item chosen as the home page
 *   /blog                    every Blog Post
 *   /blog/some-post          one Blog Post
 *   /blog/tag/gau-puja       every Blog Post carrying a label
 *   /blog/author/anuj-pandey every Blog Post by one person
 *   /some-page               one item of the type that owns the root
 */
export type Route =
  | { kind: "home" }
  | { kind: "index"; type: CmsType }
  | { kind: "filter"; type: CmsType; facet: Facet; value: string }
  | { kind: "item"; type: CmsType; slug: string }
  | { kind: "unknown" };

/** The ways a section can be narrowed. Both are paths, not query strings. */
export type Facet = "tag" | "author";

const FACETS: Facet[] = ["tag", "author"];

/** A type's path without its slashes: "/blog/" and "blog" are the same section. */
export const clean = (path: string) => path.replace(/^\/+|\/+$/g, "");

/** The type published at the site root, if the workspace has one. */
export function rootType(site: CmsSite): CmsType | undefined {
  return site.types.find((type) => clean(type.path) === "");
}

export function resolveRoute(site: CmsSite, segments: string[]): Route {
  const parts = segments.filter(Boolean);
  if (parts.length === 0) return { kind: "home" };

  const path = parts.join("/");

  /*
   * Longest prefix first. A type could publish under "/case-studies" while
   * another sits at "/case-studies/archive"; matching the shorter one first
   * would swallow the longer one's URLs.
   */
  const byPath = [...site.types]
    .filter((type) => clean(type.path) !== "")
    .sort((a, b) => clean(b.path).length - clean(a.path).length);

  for (const type of byPath) {
    const prefix = clean(type.path);
    if (path === prefix) return { kind: "index", type };
    if (path.startsWith(`${prefix}/`)) {
      const rest = path.slice(prefix.length + 1).split("/");

      /*
       * A narrowed section: /blog/tag/gau-puja.
       *
       * A path rather than ?tag=, so each one is a page in its own right - one
       * a crawler will index and a person can link to, which a query string on
       * a listing is not.
       *
       * An item slugged "tag" is still reachable at /blog/tag, because that is
       * one segment and this needs two.
       */
      if (rest.length === 2 && FACETS.includes(rest[0] as Facet)) {
        return { kind: "filter", type, facet: rest[0] as Facet, value: rest[1]! };
      }

      // One level below the prefix. Anything deeper is not a URL this site
      // publishes, and guessing at it would serve the wrong item.
      return rest.length > 1 ? { kind: "unknown" } : { kind: "item", type, slug: rest[0]! };
    }
  }

  // A single segment left over belongs to whichever type owns the root.
  const root = rootType(site);
  if (root && parts.length === 1) return { kind: "item", type: root, slug: parts[0]! };

  return { kind: "unknown" };
}

/** Where an item of a type lives, for links and the sitemap. */
export function itemPath(type: CmsType, slug: string): string {
  const prefix = clean(type.path);
  return prefix ? `/${prefix}/${slug}` : `/${slug}`;
}

/**
 * The menu, exactly as the CMS defines it.
 *
 * `nav` carries the types with "Show in navigation" turned on, in the order the
 * workspace lists them, with the label it chose. Nothing is added to it here.
 *
 * There used to be a fallback: an empty menu meant "show every type that has a
 * path". That read as helpful and was the opposite - a workspace that had
 * deliberately turned every type off got a menu of all of them, and the setting
 * appeared to do nothing. An empty menu is an answer, so it is respected.
 */
export async function navLinks(): Promise<{ label: string; href: string }[]> {
  const site = await getSite();
  return site.nav
    .filter((entry) => entry.label && entry.path)
    .map((entry) => ({ label: entry.label, href: entry.path }));
}

/** A label as it appears in a URL. One definition, so links and routes agree. */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Where a narrowed section lives. */
export function facetPath(type: CmsType, facet: Facet, value: string): string {
  const prefix = clean(type.path);
  const slug = toSlug(value);
  return prefix ? `/${prefix}/${facet}/${slug}` : `/${facet}/${slug}`;
}
