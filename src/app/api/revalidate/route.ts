import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/cms";
import { forgetKnownSlugs } from "@/lib/slug-guard";

/**
 * On-demand revalidation, called by the CMS when something changes.
 *
 * This site had none, which is why a change in the CMS took up to five
 * minutes to appear and no amount of reloading helped: the stale copy lives on
 * the server, not in the browser. Reordering the home page and watching the
 * live site not change is exactly what that looked like.
 *
 *   POST /api/revalidate  { "type": "blog" }
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *
 * A type drops the pages that read that type. `site` is a type here too: it is
 * the tag on the /site fetch, which carries the navigation, the home page's
 * sections and their order, the analytics ids and the contact details. No type
 * at all drops everything this site reads from the CMS.
 */
export const dynamic = "force-dynamic";

const SECRET = process.env.REVALIDATE_SECRET ?? "";

export async function POST(request: Request) {
  if (!SECRET) {
    return Response.json(
      { error: "Revalidation is not configured: set REVALIDATE_SECRET." },
      { status: 501 },
    );
  }

  /*
   * The header only. A secret in a query string ends up in access logs, in CDN
   * logs, and in the Referer of anything the response links to.
   */
  const offered = (request.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (offered !== SECRET) {
    // A wrong secret is not told why.
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    tags?: string[];
    slugs?: string[];
  } | null;

  /*
   * `tags` is what the CMS has always sent and `type` is what it sends now;
   * both are read so this works either side of a CMS deploy.
   */
  const types = [
    ...new Set([body?.type, ...(body?.tags ?? [])].filter((value): value is string => !!value)),
  ];

  // The bare tag every CMS fetch carries, so "something changed" always works.
  revalidateTag(CMS_TAG, { expire: 0 });
  for (const type of types) revalidateTag(`${CMS_TAG}:${type}`, { expire: 0 });

  /*
   * The edge guard keeps its own list of what each section publishes, on a
   * five minute window of its own. Dropping the cache tags without dropping
   * that list means a just-published item is refused at the proxy - a 404 on a
   * page that has only this moment gone live, which reads as the publish not
   * having worked.
   */
  forgetKnownSlugs();

  return Response.json({ revalidated: true, types });
}
