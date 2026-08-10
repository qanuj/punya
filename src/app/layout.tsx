import type { Metadata, Viewport } from "next";
import { Rozha_One, Mukta, Khand } from "next/font/google";
import { Analytics, AnalyticsNoScript, verificationMetadata } from "@tintorch/web";
import { siteName } from "@/lib/site-name";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSite } from "@/lib/cms";
import "./globals.css";

/*
 * Three families, each carrying Devanagari and Latin in one face. That is the
 * point: the planned Hindi UI needs no second type system, and a hand-lettered
 * headline in Hindi sits at the same weight as the English beside it.
 *
 * Loaded through next/font so they are self-hosted and swapped without a
 * layout shift, rather than fetched from a third party on first paint.
 */
const display = Rozha_One({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-display-loaded",
  display: "swap",
});
const sans = Mukta({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-loaded",
  display: "swap",
});
const condensed = Khand({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-condensed-loaded",
  display: "swap",
});

/*
 * `viewport-fit=cover` lets the navy bars reach the edges of a notched phone;
 * the shell below keeps the words out of the rounded corners.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * The site's own name and strapline come from the CMS, so a fork of this
 * template describes itself correctly before anyone opens an editor.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const name = site.config.branding?.legalName?.trim();
  const tagline = site.config.branding?.tagline?.trim();
  const base = site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL;

  /*
   * The short name a phone puts under the icon.
   *
   * Saved to a home screen, the legal name wraps to two lines and gets
   * truncated; the brand's own short name is what belongs under an icon. Read
   * from the workspace so a fork shows its own, with the mark's name as the
   * fallback because that is what the artwork says.
   */
  const shortName = site.config.branding?.shortName?.trim() || "Punya";

  return {
    title: { default: name || "TinTorch site", template: name ? `%s · ${name}` : "%s" },
    description: tagline || undefined,
    ...(base ? { metadataBase: new URL(base) } : {}),
    /*
     * The icons themselves are files: `src/app/favicon.ico`, `icon0.svg`,
     * `icon1.png` and `apple-icon.png` are picked up by the router without
     * being listed here, and `src/app/manifest.json` serves at /manifest.json.
     */
    appleWebApp: { capable: true, title: shortName, statusBarStyle: "default" },
    applicationName: shortName,
    /*
     * Ownership proofs from the workspace, so verifying a new property with
     * Search Console, Bing or DMCA is a save rather than a deploy.
     */
    ...verificationMetadata(site.config.verifications),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();

  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${condensed.variable}`}>
      <body>
        {/*
         * The direction contract, emitted as a real HTML comment so it survives
         * the production build and can be audited in the served markup.
         */}
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: A gau seva is a painted act, not a line on a donation form. Refuses the NGO
  template - emotive hero, amount pills, impact band, story cards.
OWN-WORLD: Painted Hoarding. One gouache panel of a cow at dusk stands torn against bone
  poster stock; indigo and bone own whole regions; one vermilion is spent only on giving.
  Deckled tears, dry-brush rules, no radius, no shadow. Rozha One / Mukta / Khand carry
  Devanagari and Latin in one system.
STORY: This trust performs named sevas at a real gaushala, each at an exact price, and
  returns proof. The visitor picks an act and pays for it.
FIRST VIEWPORT: Painted panel holds the left third full-height, torn against a poster-stock
  ledger of named sevas - vignette, name, price, action per row. The vermilion brush button
  sits in the first screen on a phone.
FORM: The Torn Ledger, comp B of three; world seed key 38080fb2.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
  the verdict, and DESIGN.md
-->`,
          }}
        />

        {/*
         * Feed autodiscovery: pasting the site address into a reader finds the
         * feed rather than needing the URL typed out.
         *
         * A tag rather than `alternates.types` in the metadata, because a page
         * that sets its own canonical replaces the whole `alternates` object -
         * so a copy there never reaches the head. React hoists this into it
         * from anywhere in the tree.
         */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${await siteName()} - Blog`}
          href="/feed.xml"
        />

        {/* Belongs immediately after <body>, and renders nothing unless a tag
            manager is configured. */}
        <AnalyticsNoScript config={site.config.analytics} />

        {/* First in the tab order, visible only once focused. */}
        <a href="#main" className="skip-link">
          Skip to the page
        </a>

        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />

        {/*
         * Measurement ids come from the workspace, so adding a pixel is a
         * setting rather than a release, and nothing loads for a provider with
         * no id.
         */}
        <Analytics config={site.config.analytics} />
      </body>
    </html>
  );
}
