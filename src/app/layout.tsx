import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";

/*
 * The three families the system names. Loaded through next/font so they are
 * self-hosted and swapped without a layout shift, rather than fetched from a
 * third party on first paint.
 */
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif-loaded", display: "swap" });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans-loaded", display: "swap" });
const devanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-devanagari-loaded",
  display: "swap",
});
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
    <html lang="en" className={`${serif.variable} ${sans.variable} ${devanagari.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
