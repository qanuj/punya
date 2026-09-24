import Link from "next/link";
import { notFound } from "next/navigation";
import { Body, FaqSection } from "@/components/body";
import { CardGrid } from "@/components/cards";
import { VideoGrid } from "@/components/video-grid";
import { SponsorRow } from "@/components/sponsor-row";
import { itemTags } from "@/components/item-aside";
import {
  getItem,
  getSite,
  itemBody,
  itemSummary,
  listItems,
  type CmsItem,
  type CmsType,
} from "@/lib/cms";
import { clean, toSlug, type Facet } from "@/lib/routing";

/**
 * A section's index: everything published of one type.
 *
 * These used to be resolved through the catch-all, which made them the third
 * thing that route did rather than pages in their own right - and it showed.
 * A single segment is the same shape as an item of the type that owns the
 * root, so the edge guard could not tell `/blog` from a root item and refused
 * every index this site publishes. They are routes now, one file each, and
 * this is what they render.
 *
 * An index is also allowed to say something. A `page` published at the
 * section's own path is somebody deciding what that URL should say, so its
 * heading and lead replace the type's plural name, and whatever else it has
 * written - the prose, the questions - runs below the grid, where it reads as
 * context rather than as an obstacle between a visitor and the list.
 */

/** What a section says when no page has been written for it. */
const BLURB: Record<string, string> = {
  product:
    "Choose a seva. Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala.",
  blog: "Writing on gau seva, festivals and the everyday work of running a gaushala.",
  location: "The gaushalas in our care, and the cows living in each.",
  business: "Organisations funding the work at the gaushala.",
  gaumata: "The cows in our care, each one named and accounted for.",
  video: "From the gaushala, in our own words.",
};

/*
 * publishedAt is asked for by name. A narrowed response carries only what is
 * listed - it came back with `fields`, `id`, `slug` and `title` alone - so
 * every post card rendered without its date and nothing said why.
 */
const CARD_FIELDS =
  "title,name,summary,excerpt,tagline,description,featuredImage,image,images,seo,publishedAt," +
  "price,currency,frequency,category,popular,tags,city,region,cowsInCare,capacity,embedUrl,picture,logo";

/** The type this site publishes at a path, or nothing if it publishes none. */
export async function sectionType(path: string): Promise<CmsType | undefined> {
  const site = await getSite();
  return site.types.find((type) => clean(type.path) === clean(path));
}

/**
 * The page written for this section, if one has been.
 *
 * By the section's path rather than the type's key, because that is the URL an
 * editor is writing for: a page slugged `seva` is the page at /seva, whatever
 * the type behind it happens to be called.
 */
export async function sectionPage(path: string): Promise<CmsItem | null> {
  return getItem("page", clean(path));
}

export async function SectionIndex({
  type,
  facet,
  value = "",
}: {
  type: CmsType;
  facet?: Facet;
  value?: string;
}) {
  const [{ items }, written] = await Promise.all([
    listItems(type.key, { limit: 60, fields: CARD_FIELDS }),
    // A facet is a slice of the section, not a page anyone wrote copy for.
    facet ? Promise.resolve(null) : sectionPage(type.path),
  ]);

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

  const heading = label || written?.title || type.pluralName;
  const blurb = facet ? "" : (written ? itemSummary(written) : "") || BLURB[type.key] || "";
  const body = written ? itemBody(written) : "";
  const faqs = written?.faqs ?? [];

  return (
    <>
      {/* Cream header, as every other page on the site opens. */}
      <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="shell">
          <h1 style={{ fontSize: "var(--text-h1)", lineHeight: "var(--lh-tight)" }}>{heading}</h1>

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
            <Grid items={shown} type={type} />
          )}
        </div>
      </div>

      {/*
        Whatever the page written for this URL says, under the list. A visitor
        arrived for the list; the writing is why the section exists, and it
        belongs after the thing they came for rather than in front of it.
      */}
      {body && (
        <div className="section section-cream">
          <div className="shell">
            <Body markdown={body} />
          </div>
        </div>
      )}

      {faqs.length > 0 && <FaqSection faqs={faqs} />}
    </>
  );
}

/** Videos open over the page; everything else is a card. */
function Grid({ items, type }: { items: CmsItem[]; type: CmsType }) {
  if (type.key === "video") return <VideoGrid items={items} type={type} />;
  if (type.key === "business") return <SponsorRow items={items} />;

  return <CardGrid items={items} type={type} />;
}

/**
 * Everything an index route needs: the type, and the page written for it.
 *
 * A route file for a section this workspace does not publish is a 404 rather
 * than an empty page - the route exists in this repo, the section does not
 * exist in the CMS, and only the CMS can settle that.
 */
export async function indexRoute(path: string) {
  const type = await sectionType(path);
  if (!type) notFound();
  return { type, written: await sectionPage(path) };
}

/**
 * An index's metadata.
 *
 * This returned the type's plural name and nothing else - no description, no
 * canonical - so /seva was titled "Seva" in every result and had no sentence
 * under it. A `page` published at the section's own path is somebody deciding
 * what that URL should say, and it wins where one exists.
 */
export async function indexMetadata(path: string) {
  const type = await sectionType(path);
  const written = await sectionPage(path);
  const title = written?.seo?.metaTitle || written?.title || type?.pluralName || "";
  const description =
    written?.seo?.metaDescription || (written ? itemSummary(written) : "") || BLURB[type?.key ?? ""];

  return {
    title,
    description: description || undefined,
    alternates: { canonical: `/${clean(path)}` },
    openGraph: { title, description: description || undefined, url: `/${clean(path)}` },
  };
}
