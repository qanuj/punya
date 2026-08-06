import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getItem,
  getSite,
  itemBody,
  itemImage,
  itemSummary,
  listItems,
  type CmsItem,
  type CmsType,
} from "@/lib/cms";
import { excerpt } from "@/lib/markdown";
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

    return <IndexPage type={route.type} />;
  }

  if (route.kind === "filter") {
    return <IndexPage type={route.type} facet={route.facet} value={route.value} />;
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

  return (
    <article>
      {/* Cream hero: warmth before the ask, as the brand leads with. */}
      <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="shell">
          <h1 className="max-w-3xl" style={{ fontSize: "var(--text-h1)", lineHeight: "var(--lh-tight)" }}>
            {item.title}
          </h1>
          {summary && (
            <p
              className="mt-4 max-w-2xl"
              style={{ color: "var(--ink-600)", fontSize: "var(--text-body-lg)" }}
            >
              {summary}
            </p>
          )}
        </div>
      </header>

      {body && (
        <div className="section">
          {/*
           * Prose and its aside. One column until there is room for two - a
           * sidebar stacked under a long article on a phone is a footer nobody
           * reaches.
           */}
          <div className="shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="min-w-0">
              <Body markdown={body} />
            </div>
            {type && <ItemAside item={item} type={type} />}
          </div>
        </div>
      )}

      {faqs.length > 0 && (
        <div className="section section-cream">
          <div className="shell">
            <Faqs faqs={faqs} />
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

async function IndexPage({
  type,
  facet,
  value = "",
}: {
  type: CmsType;
  facet?: Facet;
  value?: string;
}) {
  const { items } = await listItems(type.key, {
    limit: 60,
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

  const shown = facet ? items.filter(matches) : items;

  /*
   * A label nothing carries is not a page. Served as an empty section it is a
   * thin page a crawler will index and a visitor will bounce from, and there
   * are as many of those as someone can type.
   */
  if (facet && shown.length === 0) notFound();

  // The label as it was written, not as it was slugified.
  const label = !facet
    ? ""
    : facet === "author"
      ? ((shown[0]?.authors ?? []).find((author) => toSlug(author.name) === value)?.name ?? value)
      : (itemTags(shown[0] ?? ({} as CmsItem)).find((name) => toSlug(name) === value) ?? value);
  const blurb = SECTION_BLURB[type.key];

  return (
    <>
      {/* Cream header, as every other page on the site opens. */}
      <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="shell">
          <h1 style={{ fontSize: "var(--text-h1)", lineHeight: "var(--lh-tight)" }}>
            {label || type.pluralName}
          </h1>

          {facet && (
            <p className="mt-3">
              <Link href={type.path} style={{ color: "var(--navy-700)" }}>
                ← All {type.pluralName.toLowerCase()}
              </Link>
            </p>
          )}
          {blurb && (
            <p
              className="mt-4 max-w-2xl"
              style={{ color: "var(--ink-600)", fontSize: "var(--text-body-lg)" }}
            >
              {blurb}
            </p>
          )}
        </div>
      </header>

      <div className="section">
        <div className="shell">
          {shown.length === 0 ? (
            <p style={{ color: "var(--ink-600)" }}>Nothing published here yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((entry) => (
                <CardFor key={entry.id} item={entry} type={type} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
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
