import "server-only";
import { getSite } from "@/lib/cms";
import { siteOrigin } from "@/lib/sitemap-sources";

/**
 * What to call this site.
 *
 * The workspace's legal name if it has one, and the host if it does not - a
 * template that has not been filled in should still say "duggy.app" rather than
 * "This site", which is what a feed title and an llms.txt heading are read as.
 */
export async function siteName(): Promise<string> {
  const [site, origin] = await Promise.all([getSite(), siteOrigin()]);
  const named = site.config.branding?.legalName?.trim();
  if (named) return named;

  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    return "This site";
  }
}
