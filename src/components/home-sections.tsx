import Image from "next/image";
import Link from "next/link";
import { field, getSite, itemImage, itemSummary, listItems, type CmsItem, type CmsType } from "@/lib/cms";
import { itemPath } from "@/lib/routing";
import { CardFor } from "@/components/cards";

/** Rupees as a person writes them: ₹2,100, not ₹2100.00. */
function money(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
}

/** A date as a reader writes it. */
function when(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** The first label a post carries, if it carries any. */
function firstTag(item: CmsItem): string {
  const tags = Array.isArray(item.fields?.tags) ? (item.fields.tags as string[]) : [];
  return tags[0] ?? "";
}

/**
 * What the home page shows after its own words.
 *
 * The home page said what the trust is and then stopped, so the only way to
 * reach a seva or a post was the menu - and a visitor who has just read why
 * this matters is exactly the one who should be looking at what it costs to
 * help. A few of each, and a way through to the rest.
 *
 * Sections come from the CMS types, so a workspace without a Seva type simply
 * has no seva strip rather than an empty heading.
 */

const CARD_FIELDS =
  "title,name,summary,excerpt,tagline,description,featuredImage,image,images,seo,publishedAt," +
  "price,currency,frequency,category,popular,tags";

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
        <p className="lead mt-2" style={{ fontSize: "var(--text-body)" }}>
          {blurb}
        </p>
      </div>

      <Link href={href} className="btn btn-outline shrink-0">
        {more}
      </Link>
    </div>
  );
}

async function pick(type: CmsType | undefined, take: number): Promise<CmsItem[]> {
  if (!type) return [];
  const { items } = await listItems(type.key, { limit: 24, fields: CARD_FIELDS });
  return items.slice(0, take);
}

export async function HomeSections() {
  const site = await getSite();

  const seva = site.types.find((type) => type.key === "product");
  const blog = site.types.find((type) => type.key === "blog");

  const [sevaItems, posts] = await Promise.all([pick(seva, 24), pick(blog, 3)]);

  /*
   * The ones the trust has marked popular lead, and the rest follow in the
   * order the CMS returns them - a visitor deciding what to give should see
   * what most people choose first.
   */
  const featured = [
    ...sevaItems.filter((item) => item.fields?.popular === true),
    ...sevaItems.filter((item) => item.fields?.popular !== true),
  ].slice(0, 3);

  return (
    <>
      {seva && featured.length > 0 && (
        <section className="section section-cream">
          <div className="shell">
            <SectionHead
              title="Ways to serve"
              blurb="Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala."
              href={seva.path}
              more="All seva"
            />

            <div className="card-grid">
              {featured.map((item) => (
                <article key={item.id} className="seva-card">
                  <div className="seva-head">
                    <span className="seva-figure">
                      {money(field(item, "price"), field(item, "currency"))}
                    </span>
                    {field(item, "frequency") && (
                      <span className="seva-freq">
                        {field(item, "frequency").toLowerCase() === "one-time"
                          ? "once"
                          : field(item, "frequency").toLowerCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="seva-name">
                    <Link href={itemPath(seva, item.slug)}>{item.title}</Link>
                  </h3>

                  {itemSummary(item) && (
                    <p className="seva-summary line-clamp-2">{itemSummary(item)}</p>
                  )}

                  <div className="seva-band">
                    {itemImage(item) && (
                      <Image
                        src={itemImage(item)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="seva-foot">
                    <span className="flex flex-wrap items-center gap-2">
                      {field(item, "category") && (
                        <span className="chip">{field(item, "category")}</span>
                      )}
                      {item.fields?.popular === true && (
                        <span className="chip chip-gold">Most chosen</span>
                      )}
                    </span>

                    <Link href={itemPath(seva, item.slug)} className="btn btn-gold shrink-0">
                      Offer seva
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
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

            {posts[0] && (
              <Link href={itemPath(blog, posts[0].slug)} className="feature">
                <span className="feature-media">
                  {itemImage(posts[0]) && (
                    <Image
                      src={itemImage(posts[0])}
                      alt={posts[0].title}
                      fill
                      sizes="(min-width: 768px) 620px, 90vw"
                      className="object-cover"
                    />
                  )}
                </span>

                <span className="block">
                  <span className="feature-title block">{posts[0].title}</span>
                  {itemSummary(posts[0]) && (
                    <span className="feature-summary block">{itemSummary(posts[0])}</span>
                  )}
                  <span className="label-caps feed-meta">
                    {firstTag(posts[0]) && <span className="feed-tag">{firstTag(posts[0])}</span>}
                    {firstTag(posts[0]) && <span aria-hidden>·</span>}
                    <span>{when(posts[0].publishedAt ?? posts[0].createdAt)}</span>
                  </span>
                </span>
              </Link>
            )}

            {posts.length > 1 && (
              <div className="feed-rest">
                {posts.slice(1).map((item) => (
                  <Link key={item.id} href={itemPath(blog, item.slug)} className="feed-row">
                    <span className="feed-thumb">
                      {itemImage(item) && (
                        <Image
                          src={itemImage(item)}
                          alt={item.title}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 block">
                      <span className="feed-row-title block">{item.title}</span>
                      <span className="label-caps feed-meta">
                        {firstTag(item) && <span className="feed-tag">{firstTag(item)}</span>}
                        {firstTag(item) && <span aria-hidden>·</span>}
                        <span>{when(item.publishedAt ?? item.createdAt)}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
