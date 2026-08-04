import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSite } from "@/lib/cms";

/**
 * The site's own name and strapline come from the CMS, so a fork of this
 * template describes itself correctly before anyone opens an editor.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const name = site.config.branding?.legalName?.trim();
  const tagline = site.config.branding?.tagline?.trim();
  const base = site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL;

  return {
    title: { default: name || "TinTorch site", template: name ? `%s · ${name}` : "%s" },
    description: tagline || undefined,
    ...(base ? { metadataBase: new URL(base) } : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
