import { NextResponse, type NextRequest } from "next/server";
import { isKnownSlug, ROOT_SECTION } from "@/lib/slug-guard";

/**
 * Refusing URLs this site does not publish, before anything renders.
 *
 * The catch-all route is dynamic with a five minute window, and a render
 * writes a cache entry whether it produced a page or a 404. Since any single
 * segment resolves onto the type that owns the root, every address a scanner
 * invents was a cache entry, and there is no limit on how many of those there
 * are. This answers first.
 *
 * It never guesses. A section it does not recognise, a CMS it cannot reach, a
 * cold start: all of them pass through to the page, which does its own lookup
 * and 404s properly. The guard's job is to keep junk out of the cache, not to
 * be the site's only opinion about what exists.
 */

/**
 * The paths this app serves itself, which no CMS type publishes.
 *
 * A list rather than a pattern, because the alternative is asking the CMS
 * whether it publishes an item slugged "donate" on every request to the
 * donation page.
 */
const FIRST_PARTY = new Set([
  "donate",
  "account",
  "login",
  "logout",
  "auth",
  "feed",
  "feed.xml",
  "llms.txt",
  "sitemap",
  "sitemap.xml",
  "sitemap.xsl",
  "robots.txt",
  "favicon.ico",
  "opensearch.xml",
]);

/** A narrowed section - /blog/tag/gau-puja - is two segments, not a slug. */
const FACETS = new Set(["tag", "author"]);

function notFound(): NextResponse {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return NextResponse.next();

  const [first, second, ...deeper] = parts;
  if (FIRST_PARTY.has(first!)) return NextResponse.next();

  // A single segment is an item of the type that owns the root.
  if (parts.length === 1) {
    return (await isKnownSlug(ROOT_SECTION, first!)) ? NextResponse.next() : notFound();
  }

  /*
   * Two segments are a section and a slug. `isKnownSlug` admits anything under
   * a prefix that is not a section at all, so an unrecognised first segment
   * reaches the page rather than being refused here.
   */
  if (parts.length === 2) {
    if (FACETS.has(second!)) return NextResponse.next();
    return (await isKnownSlug(first!, second!)) ? NextResponse.next() : notFound();
  }

  // /blog/tag/gau-puja and nothing deeper. The page resolves the value itself.
  if (parts.length === 3 && FACETS.has(second!) && deeper.length === 1) {
    return NextResponse.next();
  }

  // Deeper than this site publishes.
  return notFound();
}

export const config = {
  /*
   * Everything but the API, the build output and anything with a file
   * extension. Assets never pay for a lookup.
   */
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[^/]+$).*)"],
};
