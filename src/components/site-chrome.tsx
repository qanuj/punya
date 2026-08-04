import Link from "next/link";
import { getSite } from "@/lib/cms";
import { navLinks } from "@/lib/routing";

/**
 * The header and footer, both built from the CMS.
 *
 * The name, the menu, the contact details and the social profiles are all
 * workspace settings, so a site forked from this template shows its own
 * identity without a line being edited here.
 */
export async function SiteHeader() {
  const [site, links] = await Promise.all([getSite(), navLinks()]);
  const name = site.config.branding?.legalName?.trim() || "";

  return (
    <header className="border-b border-line">
      <div className="shell flex flex-wrap items-baseline gap-x-5 gap-y-1 py-3">
        <Link href="/" className="font-semibold tracking-tight hover:no-underline">
          {name || "Home"}
        </Link>
        <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const site = await getSite();
  const { branding = {}, contact = {}, socialLinks = [] } = site.config;
  const name = branding.legalName?.trim() || "";
  const year = new Date().getFullYear();

  const details = [
    contact.email && { label: contact.email, href: `mailto:${contact.email}` },
    contact.phone && {
      label: contact.phone,
      href: `tel:${(contact.phoneHref || contact.phone).replace(/[^\d+]/g, "")}`,
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const address = [contact.addressLine, contact.locality, contact.region, contact.postalCode, contact.country]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="mt-12 border-t border-line">
      <div className="shell space-y-3 py-8 text-sm">
        {branding.tagline && <p className="max-w-prose text-muted">{branding.tagline}</p>}

        {details.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {details.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        )}

        {address && <p className="text-muted">{address}</p>}

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {socialLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        )}

        <p className="pt-2 text-xs text-muted">
          © {year}
          {name ? ` ${name}` : ""}
        </p>
      </div>
    </footer>
  );
}
