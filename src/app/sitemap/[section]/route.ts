import { sitemapHandlers } from "@tintorch/web";
import { siteOrigin, sitemapSources } from "@/lib/sitemap-sources";

/**
 * One content type's URLs: /sitemap/blog.xml, and /sitemap/blog-2.xml once it
 * passes 50,000. A section nothing publishes is a 404 rather than an empty
 * document, because an empty sitemap is an error in Search Console.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  const [siteUrl, sources] = await Promise.all([siteOrigin(), sitemapSources()]);
  if (!siteUrl) return new Response("Not found", { status: 404 });

  return sitemapHandlers({ siteUrl, sources, stylesheet: "/sitemap.xsl" }).section(section);
}
