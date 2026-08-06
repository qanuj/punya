import Image from "next/image";
import Link from "next/link";
import { field, itemImage, listItems, type CmsItem, type CmsType } from "@/lib/cms";
import { itemPath } from "@/lib/routing";

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

/** A tag as it appears in a URL, matching the filter the index reads. */
export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
  const mine = new Set(itemTags(item).map(tagSlug));

  return items
    .filter((entry) => entry.id !== item.id)
    .map((entry) => ({
      entry,
      shared: itemTags(entry).filter((tag) => mine.has(tagSlug(tag))).length,
    }))
    .sort((a, b) => b.shared - a.shared)
    .slice(0, take)
    .map(({ entry }) => entry);
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="mb-3 text-[11px] uppercase"
        style={{ color: "var(--ink-400)", letterSpacing: "var(--track-caps)" }}
      >
        {title}
      </h2>
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
          <span
            className="block text-sm font-semibold group-hover:underline"
            style={{ color: "var(--text-heading)" }}
          >
            {field(item, "name") || item.title}
          </span>
          {price && (
            <span className="mt-0.5 block text-sm" style={{ color: "var(--ink-400)" }}>
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
  const others = await related(item, type, 4);

  // Nothing to say: a page with no labels and a type with nothing else in it.
  if (!tags.length && !others.length) return null;

  const isSeva = type.key === "product";

  return (
    <aside className="space-y-8 lg:sticky lg:top-8 lg:self-start">
      {isSeva && (
        <div className="card space-y-3">
          <p style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
            Every contribution is recorded in the Punya app, with daily photos from the gaushala.
          </p>
          <Link href="/donate" className="btn btn-gold w-full">
            Offer this seva
          </Link>
        </div>
      )}

      {tags.length > 0 && (
        <Panel title={isSeva ? "Category" : "Tags"}>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                {/* Through to the section, filtered - a label that is not a way
                    to more of the same is decoration. */}
                <Link
                  href={`${type.path}?tag=${tagSlug(tag)}`}
                  className="inline-block rounded-[var(--radius-pill)] px-3 py-1.5 text-sm transition-colors"
                  style={{ background: "var(--surface-warm)", color: "var(--navy-700)" }}
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
            className="mt-4 inline-block text-sm font-semibold"
            style={{ color: "var(--navy-700)" }}
          >
            Browse {type.pluralName} →
          </Link>
        </Panel>
      )}
    </aside>
  );
}
