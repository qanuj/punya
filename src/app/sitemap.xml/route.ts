import { sitemapHandlers } from "@tintorch/web";
import { siteOrigin, sitemapSources } from "@/lib/sitemap-sources";

/**
 * The index: one entry per content type, and none for a type with no records.
 * A crawler that was never handed a sitemap finds it from robots.txt, which
 * points here.
 */
export const revalidate = 3600;

export async function GET() {
  const [siteUrl, sources] = await Promise.all([siteOrigin(), sitemapSources()]);
  if (!siteUrl) return new Response("Not found", { status: 404 });

  return sitemapHandlers({ siteUrl, sources, stylesheet: "/sitemap.xsl" }).index();
}
