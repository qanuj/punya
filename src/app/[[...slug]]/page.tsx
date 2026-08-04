import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { itemPath, resolveRoute, type Route } from "@/lib/routing";

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

type Params = { params: Promise<{ slug?: string[] }> };

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

export default async function Page({ params }: Params) {
  const { slug = [] } = await params;
  const { route, item } = await resolve(slug);

  if (route.kind === "unknown") notFound();
  if (route.kind === "index") return <IndexPage type={route.type} />;

  /*
   * The root with no home item chosen is not an error - it is a workspace
   * nobody has finished setting up - so it says so rather than 404ing.
   */
  if (!item) {
    if (route.kind === "home") return <EmptyHome />;
    notFound();
  }

  return <ItemPage item={item} />;
}

function ItemPage({ item }: { item: CmsItem }) {
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
          <div className="shell">
            <Body markdown={body} />
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

async function IndexPage({ type }: { type: CmsType }) {
  const { items } = await listItems(type.key, {
    limit: 60,
    fields: "title,summary,excerpt,tagline,description,featuredImage,image,seo",
  });

  return (
    <section className="section">
      <div className="shell">
        <h1 className="text-2xl font-semibold tracking-tight">{type.pluralName}</h1>

        {items.length === 0 ? (
          <p className="mt-3 text-muted">Nothing published here yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {items.map((entry) => {
              const summary = itemSummary(entry);
              return (
                <li key={entry.id} className="py-3">
                  <Link href={itemPath(type, entry.slug)} className="font-medium hover:underline">
                    {entry.title}
                  </Link>
                  {summary && <p className="mt-0.5 text-sm text-muted">{summary}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
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
