/**
 * The CMS this site reads from.
 *
 * One authenticated fetch helper, cache tags per content type so a publish can
 * drop exactly what changed, and small readers over the top. The key is
 * server-only: it has no NEXT_PUBLIC_ prefix and nothing here runs in the
 * browser.
 */
import { BADGE_FIELDS, type SiteAnalytics, type SiteVerification } from "@tintorch/web";

const BASE = (process.env.TINTORCH_CMS_URL ?? "")
  .replace(/\/+$/, "")
  // An http:// base is redirected to https, and a redirect drops the
  // Authorization header - which reads as "no content" rather than as an error.
  .replace(/^http:\/\//i, "https://");

const KEY = process.env.TINTORCH_CMS_KEY ?? "";

export const configured = Boolean(BASE && KEY);

export const CMS_TAG = "cms";

async function cms<T>(path: string, revalidate = 300): Promise<T | null> {
  // The site has to build before the CMS is wired up, so a missing key is a
  // soft failure: pages render empty rather than failing the build.
  if (!configured) return null;

  const type = path.replace(/^\//, "").split(/[/?]/)[0];

  try {
    const response = await fetch(`${BASE}/api/v1/content${path}`, {
      headers: { Authorization: `Bearer ${KEY}` },
      next: { revalidate, tags: type ? [CMS_TAG, `${CMS_TAG}:${type}`] : [CMS_TAG] },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`[cms] ${response.status} ${path}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[cms] request failed: ${path}`, error);
    return null;
  }
}

export type CmsFaq = { question: string; answer: string; group?: string };

export type CmsItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, unknown>;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: string;
    keywords?: string[];
    noindex?: boolean;
  };
  canonical?: string;
  authors?: { id: string; name: string }[];
  faqs?: CmsFaq[];
};

export type CmsMeta = { total: number; page: number; pageCount: number; hasMore: boolean };

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
 * What this site is, according to the CMS: where it is served from, which types
 * it publishes and where each one lives.
 *
 * This is what makes the template generic. Nothing here knows that a blog is a
 * blog - the CMS says which types exist and what path each takes, and the
 * catch-all route resolves URLs against that.
 */
export async function getSite(): Promise<CmsSite> {
  const body = await cms<{ data: CmsSite }>("/site", 300);
  if (!body?.data) return EMPTY_SITE;
  return {
    ...EMPTY_SITE,
    ...body.data,
    config: body.data.config ?? {},
    types: body.data.types ?? [],
    nav: body.data.nav ?? [],
  };
}

export type ListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  /** Narrow the response to these keys - a listing rarely needs whole bodies. */
  fields?: string;
  revalidate?: number;
};

export async function listItems(
  type: string,
  { page = 1, limit = 24, search, fields, revalidate }: ListOptions = {},
): Promise<{ items: CmsItem[]; meta: CmsMeta | null }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("q", search);
  if (fields) params.set("fields", fields);

  const body = await cms<{ data: CmsItem[]; meta: CmsMeta }>(
    `/${type}?${params.toString()}`,
    revalidate,
  );
  return { items: body?.data ?? [], meta: body?.meta ?? null };
}

/** Every item of a type, following pagination. */
export async function listAllItems(
  type: string,
  options: { fields?: string; revalidate?: number } = {},
): Promise<CmsItem[]> {
  const all: CmsItem[] = [];

  // Bounded: a runaway pageCount must not spin here forever.
  for (let page = 1; page <= 60; page++) {
    const { items, meta } = await listItems(type, { ...options, page, limit: 100 });
    all.push(...items);
    if (!meta?.hasMore || page >= (meta?.pageCount ?? 1)) break;
  }
  return all;
}

export async function getItem(type: string, slug: string): Promise<CmsItem | null> {
  const body = await cms<{ data: CmsItem }>(`/${type}/${encodeURIComponent(slug)}`);
  return body?.data ?? null;
}

/** One field as a string, whatever the CMS stored. */
export function field(item: CmsItem | null, key: string): string {
  const value = item?.fields?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** The body of an item, whichever field this type calls it. */
export function itemBody(item: CmsItem | null): string {
  return field(item, "content") || field(item, "description") || field(item, "body");
}

/**
 * A sentence or two about an item.
 *
 * `description` is a summary for some types and the entire body for others, so
 * it only stands as one when it is short enough to be one.
 */
export function itemSummary(item: CmsItem | null): string {
  for (const key of ["summary", "excerpt", "tagline"]) {
    const value = field(item, key).trim();
    if (value) return value;
  }

  const description = field(item, "description").trim();
  if (description && description.length <= 320 && !description.includes("\n\n")) return description;

  return (item?.seo?.metaDescription ?? "").trim();
}

/** The image a card or a header should use, share image last. */
export function itemImage(item: CmsItem | null): string {
  for (const key of ["featuredImage", "image", "picture", "photo", "logo", "media"]) {
    const value = field(item, key);
    if (value.trim()) return value;
  }
  return item?.seo?.ogImage ?? "";
}

/* ── Badges ─────────────────────────────────────────────────────────────── */

/**
 * Registrations, certifications and awards for the footer.
 *
 * The fetch is here, because the authenticated client and the cache tags are
 * here; the selecting, ordering and rendering are shared - see @tintorch/web.
 *
 * A lapsed registration drops out on its own. For a trust asking the public for
 * money, a certification shown past its date is a claim it can no longer make.
 */
export async function badgeItems(): Promise<CmsItem[]> {
  return listAllItems("badge", { fields: BADGE_FIELDS, revalidate: 3600 });
}

/* ── Forms ──────────────────────────────────────────────────────────────── */

export type CmsFormField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  help?: string;
};

export type CmsForm = {
  key: string;
  name: string;
  description: string | null;
  fields: CmsFormField[];
  submitLabel?: string;
  successMessage?: string;
};

export async function getForm(key: string): Promise<CmsForm | null> {
  /*
   * A fence written as `:::form` with no key asks for /forms/, which redirects
   * to the list endpoint and answers with an array. That is truthy, so without
   * this the array reached the form component as a definition and rendering it
   * threw. A form is only a form when it carries fields.
   */
  if (!key.trim()) return null;

  const body = await cms<{ data: CmsForm }>(`/forms/${encodeURIComponent(key)}`, 60);
  const form = body?.data;
  return form && Array.isArray(form.fields) ? form : null;
}

export type SubmitResult = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  error?: string;
};

/**
 * Send a filled form back to the CMS, where it becomes a lead.
 *
 * The key is server-only, so this runs as a server action rather than from the
 * browser. A 422 comes back with the fields to highlight; anything else is
 * reported as one message rather than leaking the CMS's own wording.
 */
export async function submitForm(
  key: string,
  data: Record<string, unknown>,
  sourceUrl?: string,
): Promise<SubmitResult> {
  if (!configured) return { ok: false, error: "This form is not connected yet." };

  try {
    const response = await fetch(`${BASE}/api/v1/content/forms/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data, sourceUrl }),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as {
      data?: { message?: string };
      fieldErrors?: Record<string, string>;
      error?: { message?: string };
    };

    if (response.status === 422) {
      return { ok: false, fieldErrors: body.fieldErrors, error: "Please check the fields marked." };
    }
    if (!response.ok) return { ok: false, error: "That did not go through. Try again in a moment." };

    return { ok: true, message: body.data?.message };
  } catch (error) {
    console.error("[cms] form submit failed", error);
    return { ok: false, error: "We could not reach the server. Try again in a moment." };
  }
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
