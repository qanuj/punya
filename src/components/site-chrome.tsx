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
            color: onDark ? "var(--text-on-dark-soft)" : "var(--ink-500)",
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
      {/* The utility bar: the devotional line, and the two ways to reach a
          person. The Hindi is the accent; the number beside it is the function. */}
      <div className="topbar">
        <div className="shell topbar-bar">
          <span className="devanagari topbar-deva">गौ सेवा · गौ संरक्षण · गौ संवर्धन</span>

          <div className="topbar-right">
            {site.config.contact?.phone && (
              <a
                href={`tel:${(site.config.contact.phoneHref || site.config.contact.phone).replace(/[^\d+]/g, "")}`}
                className="topbar-contact"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                </svg>
                {site.config.contact.phone}
              </a>
            )}

            {site.config.contact?.email && (
              <a href={`mailto:${site.config.contact.email}`} className="topbar-contact topbar-mail">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
                  <path d="m3 6 9 6 9-6" />
                </svg>
                {site.config.contact.email}
              </a>
            )}

            {(site.config.socialLinks ?? []).length > 0 && (
              <span className="topbar-socials">
                {(site.config.socialLinks ?? []).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="topbar-social"
                  >
                    {link.icon ? (
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                        <path d={link.icon} />
                      </svg>
                    ) : (
                      link.label.slice(0, 1)
                    )}
                  </a>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mark and ask on one line at every width; the sections ride a rail. */}
      <header className="nav">
        <div className="shell nav-top">
          <div className="flex min-w-0 items-center">
            <Link href="/" aria-label="Punya.ngo home">
              <Wordmark />
            </Link>

            <span className="mark-note">
              <span className="mark-rule" aria-hidden />
              {site.config.branding?.legalName && (
                <span className="mark-name">{site.config.branding.legalName}</span>
              )}
            </span>
          </div>

          <Link href="/donate" className="btn btn-gold shrink-0">
            Donate Now
          </Link>
        </div>

        <div className="nav-rail">
          <nav className="shell nav-scroll" aria-label="Main">
            {menu.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
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
    <footer className="foot">
      <div className="shell py-14">
        <div className="foot-crown">
          <div className="foot-ask">
            <Wordmark onDark />
            <div className="foot-rule" />
            <p className="devanagari foot-line">हर सेवा बनेगी आपका पुण्य</p>
          </div>

          <Link href="/donate" className="btn btn-gold">
            Donate Now
          </Link>
        </div>

        <div className="foot-cols">
          <div className="space-y-3">
            <p className="label-caps foot-head">
              Reach us
            </p>
            {address && <p style={{ fontSize: "var(--text-sm)" }}>{address}</p>}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="foot-link">
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${(contact.phoneHref || contact.phone).replace(/[^\d+]/g, "")}`}
                className="foot-link"
              >
                {contact.phone}
              </a>
            )}
          </div>

          {explore.length > 0 && (
            <nav aria-label="Sections">
              <p className="label-caps foot-head">
                Explore
              </p>
              {explore.map((link) => (
                <Link key={link.href} href={link.href} className="foot-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {socialLinks.length > 0 && (
            <div>
              <p className="label-caps foot-head">
                Follow the gaushala
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="foot-social"
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
            </div>
          )}
        </div>

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
