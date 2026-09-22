import Image from "next/image";
import Link from "next/link";
import {
  field,
  getSite,
  itemBody,
  itemImage,
  itemSummary,
  listItems,
  homeSectionsFor,
  type CmsItem,
  type CmsType,
} from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { Body, FaqSection } from "@/components/body";
import { CardFor } from "@/components/cards";
import { VideoGrid } from "@/components/video-grid";

/**
 * The home page.
 *
 * Every other URL on this site is one thing - an article, a seva, a gaushala -
 * so the generic item template serves it. The home page is not one thing: it
 * is the trust asking, and the order it asks in is the whole design.
 *
 * It used to run on that template, which meant the page opened with a headline
 * alone in a cream band, ran the essay down a column beside a sidebar that
 * renders nothing on the home route, and put twelve collapsed questions in
 * front of the first mention of what a seva costs. A visitor met the
 * objection-handling before the ask.
 *
 * So: the ask and the place it happens, then what to give, then who is asking,
 * then the writing, and the questions last - where a question belongs, after
 * the answer has already been offered.
 */

const CARD_FIELDS =
  "title,name,summary,excerpt,tagline,description,featuredImage,image,images,seo,publishedAt," +
  // embedUrl is the whole of a video item: without it the card has a title and
  // a link out where the player should be, which is what it had before.
  "price,currency,frequency,category,popular,tags,embedUrl";

const GAUSHALA_FIELDS = "title,name,summary,description,image,featuredImage,city,region,seo";

/** A heading, its line, and the way to everything else. */
function SectionHead({
  eyebrow,
  title,
  blurb,
  href,
  more,
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  href?: string;
  more?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p
            className="mb-2"
            style={{
              color: "var(--ink-400)",
              fontSize: "var(--text-sm)",
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h2 style={{ fontSize: "var(--text-h2)" }}>{title}</h2>
        {blurb && (
          <p className="mt-2 max-w-xl" style={{ color: "var(--ink-600)" }}>
            {blurb}
          </p>
        )}
      </div>

      {/* No link when the workspace cleared the label: a strip is allowed to
          be the whole of what it shows. */}
      {href && more && (
        <Link href={href} className="btn btn-outline shrink-0">
          {more}
        </Link>
      )}
    </div>
  );
}

/**
 * What a strip says when the workspace has not said it.
 *
 * Settings › Site › Home page leaves the wording blank until somebody writes
 * it, and a blank heading is worse than an opinionated one. These are the
 * lines this site used to hard-code; a title typed in the CMS replaces them.
 */
const SECTION_COPY: Record<string, { title: string; blurb: string; more: string }> = {
  product: {
    title: "Ways to serve",
    blurb:
      "Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala.",
    more: "All seva",
  },
  blog: {
    title: "From the gaushala",
    blurb: "Writing on gau seva, festivals and the everyday work of caring for cows.",
    more: "All writing",
  },
  location: {
    title: "The gaushalas",
    blurb: "The shelters your seva reaches, and the cows in their care.",
    more: "All gaushalas",
  },
  gaumata: {
    title: "Gaumata",
    blurb: "The cows in our care, each one named, sponsored and accounted for.",
    more: "All gaumata",
  },
};

async function pick(type: CmsType | undefined, take: number, fields = CARD_FIELDS): Promise<CmsItem[]> {
  if (!type || take < 1) return [];

  /*
   * Seva is chosen from a wider window than it shows. The trust marks some of
   * them popular and those lead, and a strip of three that only ever looked at
   * the first three would never find the popular one sitting twentieth.
   * Everything else is already in the order the CMS returns it.
   */
  const window = type.key === "product" ? Math.max(take, 24) : take;
  const { items } = await listItems(type.key, { limit: window, fields });

  const ordered =
    type.key === "product"
      ? [
          ...items.filter((entry) => entry.fields?.popular === true),
          ...items.filter((entry) => entry.fields?.popular !== true),
        ]
      : items;

  return ordered.slice(0, take);
}

/**
 * The opening.
 *
 * Words on the left, the gaushala on the right. The trust publishes no picture
 * on the home page itself, and a headline alone across a 1200px band is a
 * poster with half of it missing - so the hero borrows the one photograph the
 * page is actually about: the shelter the money builds. Where no gaushala is
 * published, the column collapses and the words take the measure alone rather
 * than leaving a hole where a picture was meant to be.
 */
function HomeHero({
  item,
  gaushala,
  gaushalaHref,
}: {
  item: CmsItem;
  gaushala: CmsItem | null;
  gaushalaHref: string;
}) {
  const summary = itemSummary(item);
  const photo = gaushala ? itemImage(gaushala) : "";
  const place = gaushala
    ? [field(gaushala, "city"), field(gaushala, "region")].filter(Boolean).join(", ")
    : "";

  return (
    <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
      <div
        className={
          photo
            ? "shell grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
            : "shell"
        }
      >
        <div className={photo ? "min-w-0" : "max-w-3xl"}>
          {/*
            * The scale's hero size is drawn for a wide screen. Held at 56px on
            * a phone this title - a full sentence, with a pipe in it - ran to
            * five lines and pushed the ask below the fold, so it is allowed to
            * come down to the h1 size and no further.
            */}
          <h1
            style={{
              fontSize: "clamp(var(--text-h1), 5.2vw, var(--text-hero))",
              lineHeight: "var(--lh-tight)",
            }}
          >
            {item.title}
          </h1>

          {summary && (
            <p
              className="mt-5 max-w-2xl"
              style={{ color: "var(--ink-600)", fontSize: "var(--text-body-lg)" }}
            >
              {summary}
            </p>
          )}

          {/* The ask, and the way to read before asking. */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/donate" className="btn btn-gold">
              Donate now
            </Link>
            <Link href="/seva" className="btn btn-outline">
              Browse every seva
            </Link>
          </div>
        </div>

        {photo && (
          <Link href={gaushalaHref} className="block min-w-0">
            <figure className="relative aspect-[5/4] overflow-hidden rounded-[var(--radius-lg)]">
              <Image
                src={photo}
                alt={field(gaushala, "name") || gaushala?.title || ""}
                fill
                priority
                sizes="(min-width: 1024px) 560px, 92vw"
                className="object-cover"
              />
              {/* The caption names the place, so the photograph is evidence
                  rather than stock warmth. */}
              <figcaption
                className="absolute inset-x-0 bottom-0 px-5 py-4"
                style={{
                  background: "linear-gradient(to top, rgba(12,22,51,.78), rgba(12,22,51,0))",
                  color: "var(--white)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {field(gaushala, "name") || gaushala?.title}
                </span>
                {place && <span style={{ color: "var(--text-on-dark-soft)" }}> · {place}</span>}
              </figcaption>
            </figure>
          </Link>
        )}
      </div>
    </header>
  );
}

/**
 * The essay, and the gaushala beside it.
 *
 * Prose holds its 72ch measure, so on a wide screen the rest of the shell is
 * the question. It carries the place the essay is describing and the ask the
 * essay is building to - the two things a reader who has just finished it
 * wants - rather than the dead 16rem column the item template reserved here.
 */
function HomeStory({
  markdown,
  gaushala,
  gaushalaHref,
}: {
  markdown: string;
  gaushala: CmsItem | null;
  gaushalaHref: string;
}) {
  const blurb = gaushala
    ? itemSummary(gaushala) || field(gaushala, "description")
    : "";
  const place = gaushala
    ? [field(gaushala, "city"), field(gaushala, "region")].filter(Boolean).join(", ")
    : "";

  return (
    <div className="section section-cream">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <Body markdown={markdown} />
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="flex flex-col gap-5">
            {gaushala && (
              <article className="card flex flex-col gap-3">
                <h2 className="card-title">{field(gaushala, "name") || gaushala.title}</h2>
                {place && (
                  <p style={{ color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>{place}</p>
                )}
                {blurb && (
                  <p
                    className="line-clamp-5"
                    style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}
                  >
                    {blurb}
                  </p>
                )}
                <Link
                  href={gaushalaHref}
                  className="mt-1 text-sm font-semibold"
                  style={{ color: "var(--navy-700)" }}
                >
                  Visit the gaushala →
                </Link>
              </article>
            )}

            <div
              className="rounded-[var(--radius-md)] p-6"
              style={{ background: "var(--surface-warm)", border: "1px solid var(--border-warm)" }}
            >
              <h2 style={{ fontSize: "var(--text-h4)" }}>Offer a seva</h2>
              <p className="mt-2" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
                Every contribution is recorded in the Punya app, with daily photos and updates from
                the gaushala.
              </p>
              <Link href="/donate" className="btn btn-gold mt-4 w-full">
                Donate now
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Everything the home page shows, in the order the workspace asks in.
 *
 * The order, the counts and the wording are Settings › Site › Home page in the
 * CMS. They used to be written here: three types, hard-coded, in a hard-coded
 * order, with three items each and headings nobody could change without a
 * deploy. Dragging Gaumata above Blog in the CMS did nothing, a count of nine
 * showed three, and two of the four sections the workspace had turned on -
 * Gaumata and Gaushalas - never appeared at all.
 *
 * What is still the page's own: the opening, the essay the home item carries,
 * and the questions. Those are this item's content rather than strips of other
 * items, so they keep their places around the strips - the ask first, and the
 * questions last, where a question belongs once the answer has been offered.
 */
export async function HomePage({ item }: { item: CmsItem }) {
  const site = await getSite();
  /*
   * The workspace's own list, narrowed to the types this site publishes: a
   * section naming a type that has since been removed would otherwise render
   * as an empty heading linking to a 404.
   */
  const sections = homeSectionsFor(
    site.config.home,
    site.types.map((type) => type.key),
    site.types,
  );
  const typeOf = new Map(site.types.map((type) => [type.key, type]));

  /*
   * The hero and the essay both borrow a gaushala for their photograph. That
   * is a separate read from the Gaushalas strip, which may not be shown at
   * all - and when it is, the fetches dedupe rather than doubling up.
   */
  const location = site.types.find((type) => type.key === "location");

  const [gaushalas, ...lists] = await Promise.all([
    pick(location, 1, GAUSHALA_FIELDS),
    ...sections.map((section) =>
      pick(
        typeOf.get(section.type),
        section.count,
        section.type === "location" ? GAUSHALA_FIELDS : CARD_FIELDS,
      ),
    ),
  ]);

  const gaushala = gaushalas[0] ?? null;
  const gaushalaHref =
    gaushala && location ? itemPath(location, gaushala.slug) : (location?.path ?? "/");

  const body = itemBody(item);

  return (
    <article>
      <HomeHero item={item} gaushala={gaushala} gaushalaHref={gaushalaHref} />

      {sections.map((section, at) => {
        const type = typeOf.get(section.type)!;
        const items = lists[at] ?? [];
        if (items.length === 0) return null;

        const copy = SECTION_COPY[type.key];
        const href = section.moreHref || type.path;
        /*
         * A cleared label is an instruction, not an omission: the workspace can
         * take the link off a strip. It only falls back where nothing has been
         * written for this type at all.
         */
        const more = section.moreLabel || copy?.more || `All ${section.label.toLowerCase()}`;

        return (
          <section key={section.type} className="section">
            <div className="shell">
              <SectionHead
                eyebrow={section.eyebrow || undefined}
                title={section.title || copy?.title || section.label}
                blurb={section.subtitle || copy?.blurb || undefined}
                href={href}
                more={more}
              />

              {/* Videos open over the page rather than playing in a card:
                  a 16:9 player in a third of a row is a postage stamp. */}
              {type.key === "video" ? (
                <VideoGrid items={items} type={type} />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((entry) => (
                    <CardFor
                      key={entry.id}
                      item={entry}
                      type={type}
                      showImage={section.showImage !== false}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })}

      {body && <HomeStory markdown={body} gaushala={gaushala} gaushalaHref={gaushalaHref} />}

      <FaqSection
        faqs={item.faqs ?? []}
        blurb="What cow donation covers, how it reaches the gaushala, and what happens after you give."
      />
    </article>
  );
}
