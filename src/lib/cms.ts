/**
 * The CMS this site reads from.
 *
 * The client itself is `@tintorch/web/cms` now. This file used to hold its own
 * copy of the fetch, the cache tags, the pagination and the field readers, and
 * that copy had quietly fallen behind its siblings: it never wrapped `getItem`
 * in React's `cache`, so every route made twice the CMS calls it needed.
 *
 * What stays here is what only this site knows: that Punya's content model is
 * whatever the CMS says it is, that a page is not a type and still belongs in
 * a menu, and which of those pages are fine print rather than navigation.
 */
import { cache } from "react";
import { BADGE_FIELDS, type SiteAnalytics, type SiteVerification } from "@tintorch/web";
import {
  cms,
  clientIpFrom,
  getForm as getFormFrom,
  submitForm as submitFormTo,
  type CmsForm,
  type SubmitExtras,
  type SubmitResult,
} from "@tintorch/web/cms";

/*
 * Re-exported rather than re-imported everywhere: twenty files read this
 * module, and which of these names come from the package is not something
 * any of them should have to know.
 */
export {
  CMS_TAG,
  field,
  fieldBool,
  fieldList,
  fieldNumber,
  fieldRecords,
  itemBody,
  itemImage,
  itemSummary,
  clientIpFrom,
  type CmsFaq,
  type CmsForm,
  type CmsFormField,
  type CmsItem,
  type CmsMeta,
  type CmsSeo,
  type ListOptions,
  type SubmitResult,
} from "@tintorch/web/cms";

/*
 * What the home page shows, and in what order. The reading of that setting is
 * shared - four sites each had their own half of it - and only the laying out
 * is this site's.
 */
export {
  homeCount,
  homeSectionFor,
  homeSections,
  homeSectionsFor,
  type HomeSection,
} from "@tintorch/web/cms";

export const configured = cms.configured;

/*
 * Wrapped in React's cache so a route and its generateMetadata share one
 * fetch. Without this the site made two requests for every item and two for
 * every site read, on every render, which is the drift this file was carrying.
 */
export const getItem = cache(cms.getItem);
export const listItems = cms.listItems;
export const listAllItems = cms.listAllItems;

/** A content type, and where this site publishes it. */
export type CmsType = {
  key: string;
  name: string;
  pluralName: string;
  /** "/" for the type that owns the root, "/blog" and the like for the rest. */
  path: string;
};

export type SiteSocialLink = { key: string; label: string; url: string; icon?: string };

export type CmsSite = {
  siteUrl: string;
  types: CmsType[];
  nav: { label: string; path: string }[];
  home: { id: string; type: string; slug: string; title: string } | null;
  config: {
    /** Keyed by CMS type key: what the home page shows, and in what order. */
    home?: Record<string, unknown>;
    contact?: Record<string, string>;
    branding?: Record<string, string>;
    socialLinks?: SiteSocialLink[];
    /** Measurement ids - Settings › Site › Analytics in the workspace. */
    analytics?: SiteAnalytics;
    /** Ownership proofs, rendered as meta tags. */
    verifications?: SiteVerification[];
  };
};

const EMPTY_SITE: CmsSite = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  types: [],
  nav: [],
  home: null,
  config: {},
};

/**
 * What this site is, according to the CMS: where it is served from, which
 * types it publishes and where each one lives.
 *
 * This is what makes the template generic. Nothing here knows that a blog is a
 * blog - the CMS says which types exist and what path each takes, and the
 * catch-all route resolves URLs against that.
 */
export const getSite = cache(async function getSite(): Promise<CmsSite> {
  const body = await cms.request<{ data: CmsSite }>("/site", 300);
  if (!body?.data) return EMPTY_SITE;
  return {
    ...EMPTY_SITE,
    ...body.data,
    config: body.data.config ?? {},
    types: body.data.types ?? [],
    nav: body.data.nav ?? [],
  };
});

/* ── Badges ─────────────────────────────────────────────────────────────── */

/**
 * Registrations, certifications and awards for the footer.
 *
 * A lapsed registration drops out on its own. For a trust asking the public
 * for money, a certification shown past its date is a claim it can no longer
 * make. The selecting and rendering are in @tintorch/web; this is the fetch.
 */
export async function badgeItems() {
  return listAllItems("badge", { fields: BADGE_FIELDS, revalidate: 3600 });
}

/* ── Forms ──────────────────────────────────────────────────────────────── */

export const getForm = cache((key: string) => getFormFrom(cms, key));

export function submitForm(
  key: string,
  data: Record<string, unknown>,
  sourceUrl?: string,
  extra?: SubmitExtras,
): Promise<SubmitResult> {
  return submitFormTo(cms, key, data, sourceUrl, extra);
}

/**
 * Whether a submission has to carry a solved Turnstile token.
 *
 * The form definition is the only thing that knows. A site cannot infer it
 * from the absence of a token, because that absence is exactly what a bot
 * posting the server action directly would produce - which is how this site
 * shipped Turnstile end to end while enforcing nothing.
 */
export function turnstileRequired(form: CmsForm | null): boolean {
  return Boolean(form?.turnstile?.siteKey);
}

/* ── Pages, for the menus ───────────────────────────────────────────────── */

export type PageLink = { href: string; label: string };

/**
 * The pages this site publishes, minus the one serving as the home page.
 *
 * The header carries the types the CMS flags for navigation, which is how
 * Gaushalas and Seva get there - but a page is not a type, so About, Contact,
 * Transparency and the policies had no way into any menu at all. They were
 * live, in the sitemap, and unreachable by clicking.
 *
 * The home item is dropped because it answers at "/" and its own slug
 * redirects there, so listing it is a link to a redirect.
 */
export async function pageLinks(): Promise<PageLink[]> {
  const [site, items] = await Promise.all([
    getSite(),
    listAllItems("page", { fields: "title", revalidate: 3600 }),
  ]);

  return items
    .filter((item) => item.id !== site.home?.id && item.slug !== "home")
    .map((item) => ({ href: `/${item.slug}`, label: item.title }));
}

/** Policies and terms, which belong in the fine print rather than the menu. */
export function isLegalPage(link: PageLink): boolean {
  return /privacy|terms|policy|cookie|refund|disclaimer|accessib/i.test(link.href);
}
