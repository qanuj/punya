import { sitemapStylesheetXsl, stylesheetResponse } from "@tintorch/web";
import { siteName } from "@/lib/site-name";

/**
 * The view a person gets when they open a sitemap.
 *
 * Navy, gold and cream - the design system's own palette, so the page reads as
 * part of this site rather than as somebody else's default.
 */
export const revalidate = 86400;

export async function GET() {
  return stylesheetResponse(
    sitemapStylesheetXsl({
      title: `Sitemap - ${await siteName()}`,
      theme: {
        background: "#101C3F",
        surface: "#14224E",
        border: "rgba(255,255,255,.15)",
        accent: "#D9952A",
        heading: "#FFFFFF",
        text: "#E8EDF8",
        muted: "#B9C4E2",
        font: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
      },
    }),
  );
}
