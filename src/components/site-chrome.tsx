import Image from "next/image";
import Link from "next/link";
import { footerBadges, getSite } from "@/lib/cms";
import { navLinks } from "@/lib/routing";
import { BadgeLink } from "@/components/badge-link";

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

export async function SiteHeader() {
  const links = await navLinks();

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
            {links.map((link) => (
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

export async function SiteFooter() {
  const [site, badges] = await Promise.all([getSite(), footerBadges()]);
  const { contact = {}, socialLinks = [] } = site.config;
  const year = new Date().getFullYear();

  const address = [contact.addressLine, contact.locality, contact.region, contact.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <footer style={{ background: "var(--surface-footer)", color: "var(--text-on-dark-soft)" }}>
      <div className="shell py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
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

        {badges.length > 0 && (
          /*
           * Registrations and certifications, above the legal line: on a page
           * that asks for a donation, the proof belongs next to the ask.
           *
           * Drawn as supplied, with no plate behind them - these are other
           * people's marks, and boxing in artwork that already carries its own
           * background is not this footer's call to make.
           */
          <ul
            className="mt-10 flex flex-wrap items-center gap-6 pt-8"
            style={{ borderTop: "1px solid var(--divider-on-dark)" }}
          >
            {badges.map((badge) => {
              const mark = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.image}
                  alt={
                    badge.issuer && badge.issuer !== badge.name
                      ? `${badge.name} - ${badge.issuer}`
                      : badge.name
                  }
                  loading="lazy"
                  className="h-14 w-auto max-w-[11rem] object-contain"
                />
              );

              return (
                <li key={badge.id} className="flex items-center">
                  {badge.url ? (
                    <BadgeLink href={badge.url} siteUrl={site.siteUrl} title={badge.name}>
                      {mark}
                    </BadgeLink>
                  ) : (
                    mark
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div
          className="mt-10 flex flex-wrap items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid var(--divider-on-dark)", fontSize: "var(--text-sm)" }}
        >
          <span>© {year} Punya.ngo · All Rights Reserved</span>
          <span>Made with ♥ for Gau Seva</span>
        </div>
      </div>
    </footer>
  );
}
