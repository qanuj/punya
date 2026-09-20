import Image from "next/image";
import Link from "next/link";
import {
  field,
  getSite,
  itemBody,
  itemImage,
  itemSummary,
  listItems,
  type CmsItem,
  type CmsType,
} from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { Body, Faqs } from "@/components/body";
import { CardFor } from "@/components/cards";

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
  "price,currency,frequency,category,popular,tags";

const GAUSHALA_FIELDS = "title,name,summary,description,image,featuredImage,city,region,seo";

/** A heading, its line, and the way to everything else. */
function SectionHead({
  title,
  blurb,
  href,
  more,
}: {
  title: string;
  blurb: string;
  href: string;
  more: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 style={{ fontSize: "var(--text-h2)" }}>{title}</h2>
        <p className="mt-2 max-w-xl" style={{ color: "var(--ink-600)" }}>
          {blurb}
        </p>
      </div>

      <Link href={href} className="btn btn-outline shrink-0">
        {more}
      </Link>
    </div>
  );
}

async function pick(type: CmsType | undefined, take: number, fields = CARD_FIELDS): Promise<CmsItem[]> {
  if (!type) return [];
  const { items } = await listItems(type.key, { limit: 24, fields });
  return items.slice(0, take);
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
 * Everything the home page shows, in the order it asks in.
 *
 * Sections come from the CMS types, so a workspace without a Seva type simply
 * has no seva strip rather than an empty heading.
 */
export async function HomePage({ item }: { item: CmsItem }) {
  const site = await getSite();

  const seva = site.types.find((type) => type.key === "product");
  const blog = site.types.find((type) => type.key === "blog");
  const location = site.types.find((type) => type.key === "location");

  const [sevaItems, posts, gaushalas] = await Promise.all([
    pick(seva, 24),
    pick(blog, 3),
    pick(location, 1, GAUSHALA_FIELDS),
  ]);

  const gaushala = gaushalas[0] ?? null;
  const gaushalaHref =
    gaushala && location ? itemPath(location, gaushala.slug) : (location?.path ?? "/");

  /*
   * The ones the trust has marked popular lead, and the rest follow in the
   * order the CMS returns them - a visitor deciding what to give should see
   * what most people choose first.
   */
  const featured = [
    ...sevaItems.filter((entry) => entry.fields?.popular === true),
    ...sevaItems.filter((entry) => entry.fields?.popular !== true),
  ].slice(0, 3);

  const body = itemBody(item);

  /*
   * The questions keep the group heading the CMS gave them - the heading of
   * the section of body they were written under - and on the home page that
   * heading is the essay's own, repeated. The section says what they are.
   */
  const faqs = (item.faqs ?? []).map((faq) => ({ ...faq, group: undefined }));

  return (
    <article>
      <HomeHero item={item} gaushala={gaushala} gaushalaHref={gaushalaHref} />

      {seva && featured.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              title="Ways to serve"
              blurb="Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala."
              href={seva.path}
              more="All seva"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((entry) => (
                <CardFor key={entry.id} item={entry} type={seva} />
              ))}
            </div>
          </div>
        </section>
      )}

      {body && (
        <HomeStory markdown={body} gaushala={gaushala} gaushalaHref={gaushalaHref} />
      )}

      {blog && posts.length > 0 && (
        <section className="section">
          <div className="shell">
            <SectionHead
              title="From the gaushala"
              blurb="Writing on gau seva, festivals and the everyday work of caring for cows."
              href={blog.path}
              more="All writing"
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((entry) => (
                <CardFor key={entry.id} item={entry} type={blog} />
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="section section-warm">
          <div className="shell">
            <div className="mb-8 max-w-2xl">
              <h2 style={{ fontSize: "var(--text-h2)" }}>Questions, answered</h2>
              <p className="mt-2" style={{ color: "var(--ink-600)" }}>
                What cow donation covers, how it reaches the gaushala, and what happens after you
                give.
              </p>
            </div>

            <Faqs faqs={faqs} columns={2} />
          </div>
        </section>
      )}
    </article>
  );
}
