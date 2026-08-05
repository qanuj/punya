"use client";

import { usePathname } from "next/navigation";

/**
 * The link on a footer badge.
 *
 * DMCA ships a helper script whose entire job is to append `refurl=<current
 * page>` to its own badge links, so that a click on the badge tells DMCA which
 * page it was clicked from. That is the one thing the script does - it makes no
 * request of its own - and doing it here means the expectation is met without a
 * blocking third-party script on every page. Their own version also throws on
 * any page where the anchor carries no `dmca-badge` class, which is every page
 * of this site.
 *
 * Only DMCA links get the parameter. Appending it to every provider's link
 * would hand GoodFirms and the rest a log of which pages a visitor was reading,
 * which none of them asked for and none of them need.
 *
 * A client component so the path is known - the footer is in the layout, and a
 * server component cannot see which page it is on. `usePathname` resolves
 * during the server render too, so the href is correct in the HTML rather than
 * being patched in after hydration.
 */
export function BadgeLink({
  href,
  siteUrl,
  title,
  children,
}: {
  href: string;
  siteUrl: string;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <a
      href={withRefurl(href, `${siteUrl}${pathname}`)}
      target="_blank"
      /* Someone else's listing is not a page this site vouches for, so the
         link passes no signal. */
      rel="noopener noreferrer nofollow"
      title={title}
    >
      {children}
    </a>
  );
}

/**
 * The badge's link, carrying the page it was clicked from - DMCA only.
 *
 * Appended as plain text rather than through `searchParams`, which would
 * percent-encode it. DMCA's own script writes `+ "refurl=" + document.location`
 * with no encoding, and their status page reads back what that produces - so an
 * encoded URL is a different string from the one they are expecting. Matching
 * their format is the whole point of doing this here.
 */
export function withRefurl(href: string, pageUrl: string): string {
  try {
    const url = new URL(href);
    if (!/(^|\.)dmca\.com$/i.test(url.hostname)) return href;
    // Already carries one - a link stored with the parameter baked in.
    if (url.searchParams.has("refurl")) return href;
  } catch {
    // Not a URL we can take apart; leave it exactly as the CMS holds it.
    return href;
  }

  return `${href}${href.includes("?") ? "&" : "?"}refurl=${pageUrl}`;
}
