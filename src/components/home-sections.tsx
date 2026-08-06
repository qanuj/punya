import Link from "next/link";
import { getSite, listItems, type CmsItem, type CmsType } from "@/lib/cms";
import { CardFor } from "@/components/cards";

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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <CardFor key={item.id} item={item} type={seva} />
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((item) => (
                <CardFor key={item.id} item={item} type={blog} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
