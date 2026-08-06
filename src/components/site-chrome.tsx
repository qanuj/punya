import Image from "next/image";
import Link from "next/link";
import { badgeItems, getSite, isLegalPage, pageLinks, type CmsSite } from "@/lib/cms";
import { navLinks } from "@/lib/routing";
import { BadgeRow, selectFooterBadges } from "@tintorch/web";

/**
 * The header and footer.
 *
 * The pattern the brand already uses: a dark utility topbar carrying the
 * devotional line, a white header with the mark, the menu and one gold Donate
 * call to action, and a navy footer. Menu entries come from the CMS, so a
 * section appears when a type is flagged for navigation there.
 */

/**
 * The mark and the wordmark.
 *
 * "Punya" navy, ".ngo" gold, with the brand line letterspaced beneath. The
 * system is explicit that the mark is never redrawn, so the artwork is used as
 * supplied.
 */
function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <Image src="/brand/logo-icon.png" alt="" width={44} height={44} priority />
      <span className="leading-none">
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: "var(--weight-heading)",
            fontSize: "var(--text-h3)",
            color: onDark ? "var(--white)" : "var(--navy-700)",
          }}
        >
          Punya<span style={{ color: "var(--gold-400)" }}>.ngo</span>
        </span>
        <span
          className="mt-1 block"
          style={{
            fontSize: "10px",
            letterSpacing: "var(--track-caps)",
            textTransform: "uppercase",
            color: onDark ? "var(--text-on-dark-soft)" : "var(--ink-400)",
          }}
        >
          Care · Respect · Nurture
        </span>
      </span>
    </span>
  );
}

/** Pages that earn a place in the top menu; the rest live in the footer. */
const HEADER_PAGES = ["/about", "/our-work", "/transparency", "/contact"];

/**
 * Type sections the menu carries whether or not the CMS flags them.
 *
 * "Show in navigation" is off for Blog, so sixty-three posts were reachable
 * only from a link inside a page. Listed here rather than waiting for the flag,
 * and skipped when the flag is on so turning it on does not produce two Blogs.
 */
const HEADER_TYPES = ["/blog"];

export async function SiteHeader() {
  const [links, pages, site] = await Promise.all([navLinks(), pageLinks(), getSite()]);

  /*
   * The CMS flags types for navigation - which is how Gaushalas and Seva get
   * here - but a page is not a type, so About and Contact had no way into any
   * menu. Ordered as listed rather than as published, because a menu's order
   * is a decision and the CMS has nowhere to record it.
   */
  const menu = dedupe([
    ...links,
    ...typeLinks(site, HEADER_TYPES),
    ...HEADER_PAGES.map((href) => pages.find((page) => page.href === href)).filter(
      (page): page is NonNullable<typeof page> => Boolean(page),
    ),
  ]);

  return (
    <>
      {/* The utility bar. The Hindi line is a devotional accent, never the
          functional content - the English beside it carries that. */}
      <div style={{ background: "var(--surface-topbar)", color: "var(--text-on-dark-soft)" }}>
        <div className="shell flex flex-wrap items-center justify-between gap-2 py-2">
          <span className="devanagari" style={{ fontSize: "var(--text-sm)" }}>
            गौ सेवा · गौ संरक्षण · गौ संवर्धन
          </span>
          <span style={{ fontSize: "var(--text-xs)" }}>Serving Cows, Serving Dharma</span>
        </div>
      </div>

      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--border-warm)" }}>
        <div className="shell flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
          <Link href="/" aria-label="Punya.ngo home">
            <Wordmark />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {menu.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ color: "var(--navy-700)", fontWeight: 600 }}
                className="text-[length:var(--text-body)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link href="/donate" className="btn btn-gold ml-auto">
            Donate Now
          </Link>
        </div>
      </header>
    </>
  );
}

/** Sections named by path, as the CMS titles them. */
function typeLinks(site: CmsSite, paths: string[]) {
  return paths
    .map((path) => site.types.find((type) => type.path === path))
    .filter((type): type is NonNullable<typeof type> => Boolean(type))
    .map((type) => ({ href: type.path, label: type.pluralName || type.name }));
}

/** One entry per destination, the first wins - the CMS's own order leads. */
function dedupe<T extends { href: string }>(links: T[]): T[] {
  return [...new Map(links.map((link) => [link.href, link])).values()];
}

export async function SiteFooter() {
  const [site, badges, pages, nav] = await Promise.all([
    getSite(),
    badgeItems(),
    pageLinks(),
    navLinks(),
  ]);
  const { contact = {}, socialLinks = [] } = site.config;

  // The policies read as fine print; everything else is a place to go.
  const legal = pages.filter(isLegalPage);
  const explore = dedupe([
    ...nav,
    ...typeLinks(site, HEADER_TYPES),
    ...pages.filter((page) => !isLegalPage(page)),
  ]);
  const year = new Date().getFullYear();

  const address = [contact.addressLine, contact.locality, contact.region, contact.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <footer style={{ background: "var(--surface-footer)", color: "var(--text-on-dark-soft)" }}>
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Wordmark onDark />
            <p className="devanagari max-w-sm" style={{ fontSize: "var(--text-body)" }}>
              हर सेवा बनेगी आपका पुण्य
            </p>
            {address && <p style={{ fontSize: "var(--text-sm)" }}>{address}</p>}

            <div className="flex flex-wrap gap-x-5 gap-y-1" style={{ fontSize: "var(--text-sm)" }}>
              {contact.email && (
                <a href={`mailto:${contact.email}`} style={{ color: "var(--white)" }}>
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${(contact.phoneHref || contact.phone).replace(/[^\d+]/g, "")}`}
                  style={{ color: "var(--white)" }}
                >
                  {contact.phone}
                </a>
              )}
            </div>
          </div>

          {/*
           * Every page this site publishes. They were live and in the sitemap
           * with nothing linking to them, so the only way to reach Transparency
           * or the policies was to already know the URL.
           */}
          {explore.length > 0 && (
            <nav className="space-y-2" aria-label="Sections">
              <p
                className="text-[11px] uppercase"
                style={{ color: "var(--text-on-dark-soft)", letterSpacing: "var(--track-caps)" }}
              >
                Explore
              </p>
              {explore.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block"
                  style={{ color: "var(--white)", fontSize: "var(--text-sm)" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="space-y-4">
            <Link href="/donate" className="btn btn-gold">
              Donate Now
            </Link>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)]"
                    style={{ background: "rgba(255,255,255,.08)", color: "var(--white)" }}
                  >
                    {link.icon ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                        <path d={link.icon} />
                      </svg>
                    ) : (
                      link.label.slice(0, 1)
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/*
         * Registrations and certifications, above the legal line: on a page
         * that asks for a donation, the proof belongs next to the ask.
         */}
        <BadgeRow
          badges={selectFooterBadges(badges)}
          siteUrl={site.siteUrl}
          className="mt-10 flex flex-wrap items-center gap-6 border-t border-[color:var(--divider-on-dark)] pt-8"
          itemClassName="flex items-center"
          imageClassName="h-14 w-auto max-w-[11rem] object-contain"
        />

        <div
          className="mt-10 flex flex-wrap items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid var(--divider-on-dark)", fontSize: "var(--text-sm)" }}
        >
          <span>© {year} Punya.ngo · All Rights Reserved</span>

          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legal.map((link) => (
              <Link key={link.href} href={link.href} style={{ color: "var(--text-on-dark-soft)" }}>
                {link.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
