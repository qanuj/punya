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
 *   /                    the item chosen as the home page
 *   /blog                every Blog Post
 *   /blog/some-post      one Blog Post
 *   /some-page           one item of the type that owns the root
 */
export type Route =
  | { kind: "home" }
  | { kind: "index"; type: CmsType }
  | { kind: "item"; type: CmsType; slug: string }
  | { kind: "unknown" };

const clean = (path: string) => path.replace(/^\/+|\/+$/g, "");

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
      const slug = path.slice(prefix.length + 1);
      // One level below the prefix. Anything deeper is not a URL this site
      // publishes, and guessing at it would serve the wrong item.
      return slug.includes("/") ? { kind: "unknown" } : { kind: "item", type, slug };
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
