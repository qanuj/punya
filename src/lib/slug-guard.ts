import { cms } from "@tintorch/web/cms";
import { cmsSlugSource, createSlugGuard, type SlugGuard } from "@tintorch/web/slug-guard";

/**
 * Which slugs this site publishes, for the proxy to check before a page
 * renders.
 *
 * The catch-all resolves any single segment onto the type that owns the root,
 * and the route is `dynamicParams` with a five minute window. So every URL a
 * scanner invents used to render, 404, and have that 404 written to the cache,
 * with no upper bound on the slug space. The other two sites on this CMS built
 * a guard for exactly this; this one had none.
 *
 * The sections are not hard-coded, because nothing in this site is: the CMS
 * says which types exist and what path each publishes under, so the guard is
 * built from `/site` the first time it is asked a question. That does mean a
 * type added in the CMS is guarded from the next refresh rather than
 * immediately, which is the right way round - an unguarded section admits
 * everything, and admitting is the safe answer.
 */

/** A type's path without its slashes, matching `clean` in routing.ts. */
const clean = (path: string) => path.replace(/^\/+|\/+$/g, "");

/** The section name for the type that owns the root. */
export const ROOT_SECTION = "";

type SiteTypes = { data?: { types?: { key: string; path: string }[] } };

let guard: SlugGuard<string> | null = null;
let building: Promise<SlugGuard<string> | null> | null = null;

async function build(): Promise<SlugGuard<string> | null> {
  const body = await cms.request<SiteTypes>("/site", 300).catch(() => null);
  const types = body?.data?.types ?? [];
  if (!types.length) return null;

  const sections: Record<string, string> = {};
  for (const type of types) sections[clean(type.path)] = type.key;

  const ready = createSlugGuard({ sections, source: cmsSlugSource(cms) });

  /*
   * Primed before it is handed back, because `snapshot()` is empty until the
   * first question loads the lists and the proxy reads `snapshot()` to tell a
   * section index from an item of the root type. Without this the first
   * request after a cold start saw no sections, asked whether the root type
   * publishes something called "blog", and answered 404 to the blog index -
   * once per container, on whichever index was asked for first.
   */
  await ready.isKnownSlug(Object.keys(sections)[0] ?? "", "");

  return ready;
}

/** Build the guard once, and let a burst of questions share the one build. */
async function ensure(): Promise<void> {
  if (guard) return;
  building ??= build().finally(() => {
    building = null;
  });
  guard = (await building) ?? null;
}

/**
 * Whether this section publishes this slug.
 *
 * True whenever the answer is not known - an unreachable CMS, a section the
 * site does not publish, a cold start. Refusing on a missing list would turn
 * one failed fetch into a site that answers 404 to everything.
 */
export async function isKnownSlug(section: string, slug: string): Promise<boolean> {
  if (!cms.configured) return true;

  await ensure();
  if (!guard) return true;

  const sections = guard.snapshot();
  // A section nobody publishes is not a section to refuse for.
  if (Object.keys(sections).length && !(section in sections)) return true;

  return guard.isKnownSlug(section, slug);
}

/**
 * The path prefixes this site publishes a section at: blog, seva, gaumata and
 * the rest, as the CMS spells them.
 *
 * The proxy needs these because a section index is a single segment, exactly
 * like an item of the type that owns the root, and the two cannot be told
 * apart by shape. Empty until the guard has loaded, which is the fail-open
 * case: an unknown list admits everything.
 */
export async function sectionNames(): Promise<string[]> {
  if (!cms.configured) return [];
  await ensure();
  return guard ? Object.keys(guard.snapshot()) : [];
}

/** Reload on the next question. Called by the publish webhook. */
export function forgetKnownSlugs(): void {
  guard?.forget();
  guard = null;
}
