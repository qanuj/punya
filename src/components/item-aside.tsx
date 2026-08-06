import Image from "next/image";
import Link from "next/link";
import { field, itemImage, listItems, type CmsItem, type CmsType } from "@/lib/cms";
import { facetPath, itemPath, toSlug } from "@/lib/routing";

/**
 * The column beside a page.
 *
 * A post or a seva ended at its last paragraph, so the only way on was back to
 * the menu - on a site with sixty-three posts and thirty-one seva, that is the
 * whole library sitting one dead end away. The aside gives what this page is
 * about, and what to read or give next.
 */

const CARD_FIELDS =
  "title,name,summary,featuredImage,image,images,publishedAt,tags,categories," +
  "price,currency,frequency,category,popular";

/** Every label an item carries, however its type stores them. */
export function itemTags(item: CmsItem): string[] {
  const lists = ["tags", "categories"].flatMap((key) => {
    const value = item.fields?.[key];
    return Array.isArray(value) ? value.map(String) : [];
  });

  // A seva has one category rather than a list, and it reads the same way.
  const single = [field(item, "category")].filter(Boolean);

  return [...new Set([...lists, ...single].map((tag) => tag.trim()).filter(Boolean))];
}

/**
 * Items worth going to next.
 *
 * Ranked by how many labels they share with this one, then by whatever the CMS
 * returns - so a Gau Daan seva leads to the other Gau Daan seva rather than to
 * whatever happens to be newest. With nothing in common it still shows the
 * latest, because an empty sidebar helps nobody.
 */
async function related(item: CmsItem, type: CmsType, take: number): Promise<CmsItem[]> {
  const { items } = await listItems(type.key, { limit: 40, fields: CARD_FIELDS });
  const mine = new Set(itemTags(item).map(toSlug));

  return items
    .filter((entry) => entry.id !== item.id)
    .map((entry) => ({
      entry,
      shared: itemTags(entry).filter((tag) => mine.has(toSlug(tag))).length,
    }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, take)
    .map(({ entry }) => entry);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label-caps mb-3">{title}</h2>
      {children}
    </section>
  );
}

/** One related item: a thumbnail, a title, and the number if it has one. */
function Row({ item, type }: { item: CmsItem; type: CmsType }) {
  const image = itemImage(item);
  const price = field(item, "price");

  return (
    <li>
      <Link href={itemPath(type, item.slug)} className="group flex items-start gap-3">
        {image ? (
          <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[color:var(--surface-warm)]">
            <Image src={image} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ) : null}

        <span className="min-w-0">
          <span className="link-strong block group-hover:underline">
            {field(item, "name") || item.title}
          </span>
          {price && (
            <span className="figure-unit mt-0.5 block">
              ₹{Number(price).toLocaleString("en-IN")}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export async function ItemAside({ item, type }: { item: CmsItem; type: CmsType }) {
  const tags = itemTags(item);
  const authors = item.authors ?? [];
  const others = await related(item, type, 4);

  // Nothing to say: a page with no labels and a type with nothing else in it.
  if (!tags.length && !authors.length && !others.length) return null;

  const isSeva = type.key === "product";

  return (
    <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
      {isSeva && (
        <div className="card space-y-3">
          <p className="meta">
            Every seva is recorded in the Punya app, with daily photos from the gaushala.
          </p>
          <Link href="/donate" className="btn btn-gold w-full">
            Offer this seva
          </Link>
        </div>
      )}

      {authors.length > 0 && (
        <Panel title="Written by">
          <ul className="space-y-1">
            {authors.map((author) => (
              <li key={author.id}>
                <Link
                  href={facetPath(type, "author", author.name)}
                  className="link-strong"
                >
                  {author.name}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {tags.length > 0 && (
        <Panel title={isSeva ? "Category" : "Tags"}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                {/* Through to the section, filtered - a label that is not a way
                    to more of the same is decoration. */}
                <Link
                  href={facetPath(type, "tag", tag)}
                  className="chip"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {others.length > 0 && (
        <Panel title={isSeva ? "More ways to serve" : `More in ${type.pluralName}`}>
          <ul className="space-y-4">
            {others.map((entry) => (
              <Row key={entry.id} item={entry} type={type} />
            ))}
          </ul>

          <Link
            href={type.path}
            className="link-strong mt-4 inline-block"
          >
            {isSeva ? "See every seva" : `See every ${type.name.toLowerCase()}`} →
          </Link>
        </Panel>
      )}
    </aside>
  );
}
