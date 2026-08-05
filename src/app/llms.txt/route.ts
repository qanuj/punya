import { llmsResponse, llmsTxt, type LlmsSection } from "@tintorch/web";
import { getSite, itemSummary, listAllItems } from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { siteName } from "@/lib/site-name";
import { siteOrigin } from "@/lib/sitemap-sources";

/**
 * The site as a list, for a model reading it.
 *
 * One section per content type, each entry with a one-line summary - so a
 * reader gets what this site is and which page answers what, without rendering
 * JavaScript or guessing at the navigation.
 */
export const revalidate = 3600;

export async function GET() {
  const [siteUrl, site, name] = await Promise.all([siteOrigin(), getSite(), siteName()]);

  const sections: LlmsSection[] = [];

  for (const type of site.types) {
    const items = await listAllItems(type.key, {
      fields: "slug,title,summary,excerpt,tagline,description",
      revalidate: 3600,
    });
    if (!items.length) continue;

    sections.push({
      title: type.pluralName || type.name,
      links: items.map((item) => ({
        path: itemPath(type, item.slug),
        title: item.title || item.slug,
        summary: itemSummary(item),
      })),
    });
  }

  return llmsResponse(
    llmsTxt({
      siteUrl,
      name,
      summary: site.config.branding?.tagline?.trim(),
      sections,
    }),
  );
}
