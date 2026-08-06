import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  field,
  getItem,
  getSite,
  itemBody,
  itemImage,
  itemSummary,
  listItems,
  type CmsItem,
  type CmsType,
} from "@/lib/cms";
import { excerpt, headingId, headings, stripTrailingHeading, trailingHeading } from "@/lib/markdown";
import { Body, Faqs } from "@/components/body";
import { CardFor } from "@/components/cards";
import { HomeSections } from "@/components/home-sections";
import { ItemAside, itemTags } from "@/components/item-aside";
import { facetPath, itemPath, resolveRoute, toSlug, type Facet, type Route } from "@/lib/routing";

/**
 * Every page on the site.
 *
 * There is one route file on purpose. A template cannot know what a workspace
 * publishes, so it does not guess: the CMS says which types exist and where
 * each one lives, and this resolves a URL against that. Adding a content type
 * in the CMS gives this site a section; it needs no file and no deploy.
 *
 * Anything a particular site wants to say differently belongs in the CMS as
 * content, not here as a special case.
 */

export const revalidate = 300;
export const dynamicParams = true;

type Params = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** The item a URL resolves to, or null when it names a listing or nothing. */
async function resolve(segments: string[]): Promise<{ route: Route; item: CmsItem | null }> {
  const site = await getSite();
  const route = resolveRoute(site, segments);

  if (route.kind === "home") {
    const home = site.home;
    return { route, item: home ? await getItem(home.type, home.slug) : null };
  }
  if (route.kind === "item") {
    return { route, item: await getItem(route.type.key, route.slug) };
  }
  return { route, item: null };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug = [] } = await params;
  const { route, item } = await resolve(slug);

  if (route.kind === "index") {
    return { title: route.type.pluralName };
  }

  /*
   * A narrowed section is a page of its own, so it says what it is. Without a
   * title of its own every tag page would share the section's, and a search
   * engine shown forty identical titles picks one and drops the rest.
   */
  if (route.kind === "filter") {
    const name = route.value.replace(/-/g, " ");
    return {
      title:
        route.facet === "author"
          ? `${name} - ${route.type.pluralName}`
          : `${name} - ${route.type.pluralName}`,
      description:
        route.facet === "author"
          ? `Everything in ${route.type.pluralName} written by ${name}.`
          : `Everything in ${route.type.pluralName} about ${name}.`,
    };
  }

  if (!item) return {};

  const title = item.seo?.metaTitle || item.title;
  const description = item.seo?.metaDescription || itemSummary(item) || excerpt(itemBody(item));
  const image = item.seo?.ogImage || itemImage(item);

  return {
    title,
    description: description || undefined,
    alternates: { canonical: item.canonical || undefined },
    openGraph: {
      title,
      description: description || undefined,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    ...(item.seo?.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Page({ params, searchParams }: Params) {
  const { slug = [] } = await params;
  const query = (await searchParams) ?? {};
  const { route, item } = await resolve(slug);

  if (route.kind === "unknown") notFound();
  if (route.kind === "index") {
    /*
     * ?tag= was the first shape these filters took. Anything already linked or
     * indexed under it is moved to the path form rather than served at both.
     */
    const tag = typeof query.tag === "string" ? query.tag : "";
    if (tag) permanentRedirect(facetPath(route.type, "tag", tag));

    return <IndexPage type={route.type} page={pageOf(query)} search={searchOf(query)} />;
  }

  if (route.kind === "filter") {
    return (
      <IndexPage
        type={route.type}
        facet={route.facet}
        value={route.value}
        page={pageOf(query)}
        search={searchOf(query)}
      />
    );
  }

  /*
   * The root with no home item chosen is not an error - it is a workspace
   * nobody has finished setting up - so it says so rather than 404ing.
   */
  if (!item) {
    if (route.kind === "home") return <EmptyHome />;
    notFound();
  }

  /*
   * The home page carries its own words and then the site: a few seva and a
   * few posts, each with a way through to the rest. Anywhere else, the page is
   * the page.
   */
  return (
    <>
      <ItemPage item={item} type={route.kind === "item" ? route.type : undefined} />
      {route.kind === "home" && <HomeSections />}
    </>
  );
}

function ItemPage({ item, type }: { item: CmsItem; type?: CmsType }) {
  const summary = itemSummary(item);
  const body = itemBody(item);
  const faqs = item.faqs ?? [];

  /*
   * A body that ends on a bare heading is ending on a label for the questions
   * the CMS holds separately, so the page said "Frequently Asked Questions"
   * twice with an empty gap between. The heading belongs to the FAQ section,
   * which renders it once, below.
   */
  const reading = faqs.length > 0 ? stripTrailingHeading(body) : body;
  const faqHeading = faqs.length > 0 ? trailingHeading(body) : "";
  /*
   * The questions are a section of the page even though they live outside the
   * body, so the contents list carries them - dropping the heading from the
   * reading must not drop the way to reach it.
   */
  const sections = [
    ...headings(reading),
    ...(faqHeading ? [{ level: 2, text: faqHeading, id: headingId(faqHeading) }] : []),
  ];

  return (
    <article>
      {/* Cream hero: the line, then the ask, inside the first screen. */}
      <header className="hero">
        <div className="shell">
          <h1 className="hero-title">{item.title}</h1>
          {summary && <p className="hero-lead">{summary}</p>}

          <div className="hero-act">
            <Link href="/donate" className="btn btn-gold">
              Donate Now
            </Link>
            <span className="hero-note">Every seva is recorded in the Punya app.</span>
          </div>
        </div>
      </header>

      {body && (
        <div className="section">
          <div
            className={
              sections.length > 1
                ? "shell toc-grid"
                : type
                  ? "shell article-grid"
                  : "shell article-solo"
            }
          >
            {sections.length > 1 && (
              <nav className="toc" aria-label="On this page">
                <p className="label-caps toc-head">On this page</p>
                <div className="toc-list">
                  {sections.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      className={entry.level === 3 ? "toc-link is-sub" : "toc-link"}
                    >
                      {entry.text}
                    </a>
                  ))}
                </div>
              </nav>
            )}

            <div className="article-read min-w-0">
              <Body markdown={reading} />
            </div>

            {type && <ItemAside item={item} type={type} />}
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="section section-cream">
          <div className="shell">
            <div className="faq-head">
              <div>
                <h2 id={headingId(faqHeading || "Frequently asked questions")} className="faq-heading">
                  {faqHeading || "Frequently asked questions"}
                </h2>
                <p className="faq-count">
                  {faqs.length} {faqs.length === 1 ? "question" : "questions"}, answered
                </p>
              </div>

              <Link href="/contact" className="btn btn-outline shrink-0">
                Ask something else
              </Link>
            </div>

            <Faqs faqs={faqs} showGroupTitles={false} />
          </div>
        </div>
      )}
    </article>
  );
}

/**
 * One line under a section's heading.
 *
 * Written here rather than in the CMS because there is nowhere in the CMS to
 * put it - a type carries a name and a path and nothing that says what the
 * section is for. A type with no line simply has none.
 */
const SECTION_BLURB: Record<string, string> = {
  product: "Choose a seva. Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala.",
  blog: "Writing on gau seva, festivals and the everyday work of running a gaushala.",
  location: "The gaushalas in our care, and the cows living in each.",
};

/** Thirty to a page: enough to browse, few enough to load on mobile data. */
const PER_PAGE = 30;

/**
 * Types that are a catalogue rather than a publication.
 *
 * A donor deciding between seva wants to see the whole list and narrow it; a
 * reader of sixty-three posts wants the newest, a search box and a feed. Same
 * route, two different jobs, so the affordances differ by type rather than
 * being offered everywhere and useful nowhere.
 */
const CATALOGUE_TYPES = new Set(["product", "location"]);

/**
 * Types with few enough items to give each one a row.
 *
 * A gaushala is a place, and there are a handful of them: a grid of small
 * cards throws away the photograph and the numbers that make one worth
 * visiting. A directory shows each in full.
 */
const DIRECTORY_TYPES = new Set(["location"]);

async function IndexPage({
  type,
  facet,
  value = "",
  page = 1,
  search = "",
}: {
  type: CmsType;
  facet?: Facet;
  value?: string;
  page?: number;
  search?: string;
}) {
  /*
   * A narrowed listing still filters in this file - the delivery API has no
   * query for "carries this label" - so it asks for everything and pages in
   * memory. An open listing pages at the API, which is what the meta is for.
   */
  const catalogue = CATALOGUE_TYPES.has(type.key);
  const directory = DIRECTORY_TYPES.has(type.key);

  const { items, meta } = await listItems(type.key, {
    page: facet || catalogue ? 1 : page,
    limit: facet || catalogue ? 100 : PER_PAGE,
    ...(search ? { search } : {}),
    /*
     * publishedAt is asked for by name. A narrowed response carries only what
     * is listed - it came back with `fields`, `id`, `slug` and `title` alone -
     * so every post card rendered without its date and nothing said why.
     */
    fields:
      "title,name,summary,excerpt,tagline,description,featuredImage,image,images,seo,publishedAt," +
      "price,currency,frequency,category,popular,tags,city,region,cowsInCare,capacity",
  });

  /*
   * Narrowed here rather than by the API: the delivery API has no query for
   * "carries this label" or "written by", and these listings are tens of items
   * rather than thousands.
   */
  const matches = (entry: CmsItem) =>
    facet === "author"
      ? (entry.authors ?? []).some((author) => toSlug(author.name) === value)
      : itemTags(entry).some((name) => toSlug(name) === value);

  const filtered = facet ? items.filter(matches) : items;

  /*
   * A narrowed listing pages what it filtered; an open one is already the
   * page the API returned.
   */
  const pageCount = catalogue
    ? 1
    : facet
      ? Math.max(1, Math.ceil(filtered.length / PER_PAGE))
      : (meta?.pageCount ?? 1);
  const current = Math.min(Math.max(1, page), pageCount);
  const shown =
    facet && !catalogue
      ? filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE)
      : filtered;

  /*
   * A label nothing carries is not a page. Served as an empty section it is a
   * thin page a crawler will index and a visitor will bounce from, and there
   * are as many of those as someone can type.
   */
  if (facet && filtered.length === 0) notFound();

  // The label as it was written, not as it was slugified.
  const label = !facet
    ? ""
    : facet === "author"
      ? ((shown[0]?.authors ?? []).find((author) => toSlug(author.name) === value)?.name ?? value)
      : (itemTags(shown[0] ?? ({} as CmsItem)).find((name) => toSlug(name) === value) ?? value);
  const blurb = SECTION_BLURB[type.key];

  /* Every label on this page, most-used first: the way into a narrowed view. */
  const tags = topTags(shown);
  const base = facet ? facetPath(type, facet, value) : type.path;

  return (
    <>
      {/* Cream header, as every other page on the site opens. */}
      <header className="page-header">
        <div className="shell">
          <h1 className="page-title">{label || type.pluralName}</h1>

          {facet && (
            <p className="mt-3">
              <Link href={type.path} className="link-strong">
                ← All {type.pluralName.toLowerCase()}
              </Link>
            </p>
          )}
          {blurb && <p className="lead">{blurb}</p>}
        </div>
      </header>

      <div className="section">
        <div className="shell">
          {shown.length === 0 ? (
            <p className="meta">
              {search ? "Nothing found. Try another word, or browse everything." : "Nothing published here yet."}
            </p>
          ) : directory ? (
            /* Few enough to give each one a row: the photograph, the place, the herd. */
            <div className="directory">
              {shown.map((entry) => (
                <DirectoryRow key={entry.id} item={entry} type={type} />
              ))}
            </div>
          ) : catalogue ? (
            /* A catalogue is already sorted, so its categories are the structure. */
            <CatalogueGroups items={shown} type={type} />
          ) : (
            /* A publication leads with its newest, and pages the rest. */
            <>
              <Controls
                type={type}
                base={base}
                search={search}
                tags={tags}
                current={current}
                pageCount={pageCount}
              />

              <div className="listing-lead">
                {shown.slice(0, 2).map((entry) => (
                  <FeatureCard key={entry.id} item={entry} type={type} />
                ))}
              </div>

              <div className="listing-rest">
                {shown.slice(2).map((entry) => (
                  <CardFor key={entry.id} item={entry} type={type} />
                ))}
              </div>

              <Pager base={base} search={search} current={current} pageCount={pageCount} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * One place in a directory: the photograph, where it is, and what it holds.
 */
function DirectoryRow({ item, type }: { item: CmsItem; type: CmsType }) {
  const place = [field(item, "city"), field(item, "region")].filter(Boolean).join(", ");
  const cows = field(item, "cowsInCare");
  const capacity = field(item, "capacity");

  const image = itemImage(item);

  /* No photograph means no 18rem of empty cream: the row closes up instead. */
  return (
    <Link
      href={itemPath(type, item.slug)}
      className={image ? "directory-row" : "directory-row is-plain"}
    >
      {image && (
        <span className="directory-media">
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 768px) 18rem, 90vw"
            className="object-cover"
          />
        </span>
      )}

      <span className="directory-body">
        <span className="directory-name block">{field(item, "name") || item.title}</span>
        {place && <span className="meta block">{place}</span>}
        {itemSummary(item) && <span className="meta line-clamp-2 block">{itemSummary(item)}</span>}

        {(cows || capacity) && (
          <span className="directory-stats">
            {cows && (
              <span className="block">
                <span className="directory-figure block">{cows}</span>
                <span className="label-caps">Cows in care</span>
              </span>
            )}
            {capacity && (
              <span className="block">
                <span className="directory-figure block">{capacity}</span>
                <span className="label-caps">Places</span>
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}

/** A catalogue under its own category headings, or plainly when it has one. */
function CatalogueGroups({ items, type }: { items: CmsItem[]; type: CmsType }) {
  const groups = groupByCategory(items);

  if (groups.length < 2) {
    return (
      <div className="card-grid">
        {items.map((entry) => (
          <CardFor key={entry.id} item={entry} type={type} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="group-jump">
        {groups.map((group) => (
          <a key={group.name} href={`#${toSlug(group.name)}`} className="chip">
            {group.name}
          </a>
        ))}
      </div>

      {groups.map((group) => (
        <section key={group.name} id={toSlug(group.name)} className="group">
          <div className="group-head">
            <h2 className="group-name">{group.name}</h2>
            <span className="label-caps">{countOf(group.items.length, type)}</span>
          </div>

          <div className="card-grid">
            {group.items.map((entry) => (
              <CardFor key={entry.id} item={entry} type={type} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/**
 * How many, in the type's own words.
 *
 * The count read "1 ways" on a page of one gaushala: a plural bolted to a
 * seva's vocabulary. The CMS names every type in the singular and the plural,
 * so the count uses whichever the number calls for.
 */
function countOf(total: number, type: CmsType): string {
  return `${total} ${total === 1 ? type.name : type.pluralName}`.toLowerCase();
}

/** Items under a field they carry, the biggest group first. */
function groupByField(items: CmsItem[], key: string): { name: string; items: CmsItem[] }[] {
  const groups = new Map<string, CmsItem[]>();

  for (const item of items) {
    const name = field(item, key) || "Elsewhere";
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([name, entries]) => ({ name, items: entries }))
    .sort((a, b) => b.items.length - a.items.length);
}

/** Items under the label they carry, the biggest group first. */
function groupByCategory(items: CmsItem[]): { name: string; items: CmsItem[] }[] {
  const groups = new Map<string, CmsItem[]>();

  for (const item of items) {
    const name = itemTags(item)[0] || "Everything else";
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([name, entries]) => ({ name, items: entries }))
    .sort((a, b) => b.items.length - a.items.length);
}

/* ── Listing furniture ──────────────────────────────────────────────────── */

/** ?page= and ?q=, read the way a URL actually arrives. */
function pageOf(query: Record<string, string | string[] | undefined>): number {
  const raw = typeof query.page === "string" ? Number(query.page) : 1;
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

function searchOf(query: Record<string, string | string[] | undefined>): string {
  return typeof query.q === "string" ? query.q.trim().slice(0, 80) : "";
}

/** A page's labels, most-used first. */
function topTags(items: CmsItem[]): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of itemTags(item)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}

function postDate(item: CmsItem): string {
  const value = item.publishedAt ?? item.createdAt;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** A URL that keeps the search and moves the page. */
function pageHref(base: string, search: string, page: number): string {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * Find, narrow, subscribe.
 *
 * A section of sixty-three posts with no way to search it, no way to see one
 * subject and no way to follow it is a wall. The form is a plain GET - it
 * works with JavaScript off and leaves a shareable URL - and the feed link is
 * the one people forget to offer.
 */
function Controls({
  type,
  base,
  search,
  tags,
  current,
  pageCount,
}: {
  type: CmsType;
  base: string;
  search: string;
  tags: string[];
  current: number;
  pageCount: number;
}) {
  return (
    <div className="finder">
      <form className="finder-search" action={base} method="get" role="search">
        <label className="sr-only" htmlFor="listing-q">
          Search {type.pluralName.toLowerCase()}
        </label>
        <svg
          className="finder-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="listing-q"
          type="search"
          name="q"
          defaultValue={search}
          placeholder={`Search ${type.pluralName.toLowerCase()}`}
          className="finder-input"
        />
        <button type="submit" className="btn btn-navy finder-go">
          Search
        </button>
      </form>

      <div className="finder-meta">
        {search && (
          <Link href={base} className="link-strong">
            Clear “{search}”
          </Link>
        )}
        {pageCount > 1 && (
          <span className="label-caps">
            Page {current} of {pageCount}
          </span>
        )}
        <a href="/feed.xml" className="finder-rss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="6.2" cy="17.8" r="2.2" />
            <path d="M3 10.4v3a6.6 6.6 0 0 1 6.6 6.6h3A9.6 9.6 0 0 0 3 10.4Z" />
            <path d="M3 4v3a13 13 0 0 1 13 13h3A16 16 0 0 0 3 4Z" />
          </svg>
          Subscribe
        </a>
      </div>

      {tags.length > 0 && (
        <div className="finder-tags">
          {tags.map((tag) => (
            <Link key={tag} href={facetPath(type, "tag", tag)} className="chip">
              {tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** The same three affordances, stacked for a rail. */
function Rail({
  type,
  base,
  search,
  tags,
}: {
  type: CmsType;
  base: string;
  search: string;
  tags: string[];
}) {
  return (
    <div className="rail">
      <form className="finder-search" action={base} method="get" role="search">
        <label className="sr-only" htmlFor="rail-q">
          Search {type.pluralName.toLowerCase()}
        </label>
        <svg
          className="finder-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="rail-q"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search"
          className="finder-input"
        />
      </form>

      {tags.length > 0 && (
        <div className="rail-block">
          <p className="label-caps mb-3">Subjects</p>
          <div className="finder-tags">
            {tags.map((tag) => (
              <Link key={tag} href={facetPath(type, "tag", tag)} className="chip">
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rail-block">
        <p className="label-caps mb-3">Follow</p>
        <a href="/feed.xml" className="finder-rss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="6.2" cy="17.8" r="2.2" />
            <path d="M3 10.4v3a6.6 6.6 0 0 1 6.6 6.6h3A9.6 9.6 0 0 0 3 10.4Z" />
            <path d="M3 4v3a13 13 0 0 1 13 13h3A16 16 0 0 0 3 4Z" />
          </svg>
          Subscribe by RSS
        </a>
      </div>
    </div>
  );
}

/** Previous, the numbers, next. Links, so a crawler can walk the archive. */
function Pager({
  base,
  search,
  current,
  pageCount,
}: {
  base: string;
  search: string;
  current: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const numbers = Array.from({ length: pageCount }, (_, at) => at + 1).filter(
    (page) => page === 1 || page === pageCount || Math.abs(page - current) <= 1,
  );

  return (
    <nav className="pager" aria-label="Pages">
      {current > 1 ? (
        <Link href={pageHref(base, search, current - 1)} className="pager-step">
          ← Previous
        </Link>
      ) : (
        <span className="pager-step is-off">← Previous</span>
      )}

      <span className="pager-numbers">
        {numbers.map((page, at) => (
          <span key={page} className="contents">
            {at > 0 && numbers[at - 1] !== page - 1 && <span className="pager-gap">…</span>}
            {page === current ? (
              <span className="pager-page is-here" aria-current="page">
                {page}
              </span>
            ) : (
              <Link href={pageHref(base, search, page)} className="pager-page">
                {page}
              </Link>
            )}
          </span>
        ))}
      </span>

      {current < pageCount ? (
        <Link href={pageHref(base, search, current + 1)} className="pager-step">
          Next →
        </Link>
      ) : (
        <span className="pager-step is-off">Next →</span>
      )}
    </nav>
  );
}

/** A lead story: the picture at full width, the title at display size. */
function FeatureCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const tag = itemTags(item)[0] ?? "";

  return (
    <article className="lead-card">
      <Link href={href} className="lead-media block" aria-hidden tabIndex={-1}>
        {itemImage(item) && (
          <Image
            src={itemImage(item)}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, 90vw"
            className="object-cover"
          />
        )}
      </Link>

      <div className="lead-body">
        <h2 className="lead-title">
          <Link href={href}>{item.title}</Link>
        </h2>

        {itemSummary(item) && <p className="meta line-clamp-3">{itemSummary(item)}</p>}

        <p className="label-caps lead-meta">
          {tag && <span style={{ color: "var(--gold-text)" }}>{tag}</span>}
          {tag && postDate(item) && <span aria-hidden>·</span>}
          <span>{postDate(item)}</span>
        </p>
      </div>
    </article>
  );
}

/** The price as a number, for sorting and banding. */
function priceOf(item: CmsItem): number {
  const value = Number(field(item, "price"));
  return Number.isFinite(value) ? value : 0;
}

/** The amount split for display, the way the seva cards set it. */
function amountOf(item: CmsItem): { symbol: string; digits: string; period: string } {
  const currency = field(item, "currency") || "INR";
  const value = priceOf(item);

  let formatted = `${currency} ${value.toLocaleString("en-IN")}`;
  try {
    formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    /* the fallback above already reads correctly */
  }

  const frequency = (field(item, "frequency") || "").toLowerCase();
  const period =
    frequency === "one-time" || frequency === "once"
      ? "One-time gift"
      : frequency === "monthly"
        ? "Every month"
        : frequency === "yearly" || frequency === "annual"
          ? "Every year"
          : field(item, "frequency");

  return {
    symbol: formatted.replace(/[\d.,\s]/g, "") || "₹",
    digits: formatted.replace(/[^\d.,]/g, ""),
    period,
  };
}

/** No home item chosen, or the CMS is not wired up yet. */
function EmptyHome() {
  return (
    <section className="section">
      <div className="shell max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">Nothing here yet</h1>
        <p className="mt-2 text-muted">
          Set <code>TINTORCH_CMS_URL</code> and <code>TINTORCH_CMS_KEY</code>, then choose a home
          page in the CMS under Settings → Site. Everything this site serves comes from there.
        </p>
      </div>
    </section>
  );
}
