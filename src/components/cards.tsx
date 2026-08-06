import Image from "next/image";
import Link from "next/link";
import { field, itemImage, itemSummary, type CmsItem, type CmsType } from "@/lib/cms";
import { itemPath } from "@/lib/routing";

/**
 * The cards a listing is made of.
 *
 * A trust asking the public for money is asking on the strength of what it can
 * show, so a listing that reads as a row of underlined titles is throwing away
 * the photograph, the amount and the promise attached to each one. Each type
 * gets the card its content actually holds: a seva has a price and a
 * frequency, a post has a picture and a date, a gaushala has cows in it.
 */

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

function when(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * The picture on a card.
 *
 * Fixed aspect and `object-cover`, because these come from a dozen sources at a
 * dozen sizes and a grid of cards whose images each set their own height is not
 * a grid. `sizes` is spelled out so a phone is not sent a 1200px photograph for
 * a 350px card.
 */
function Cover({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  if (!src) return null;

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--surface-warm)]">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}

/**
 * One seva.
 *
 * The amount is the thing being decided, so it is the largest thing on the
 * card after the name. "Popular" is the trust's own steer and earns the one
 * gold mark on the card.
 */
export function SevaCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const price = field(item, "price");
  const frequency = field(item, "frequency");
  const category = field(item, "category");
  const popular = item.fields?.popular === true;

  return (
    <article className="card flex flex-col gap-3">
      <Link href={href} className="block">
        <Cover src={itemImage(item)} alt={item.title} />
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {category && (
          <span
            className="rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] uppercase"
            style={{
              background: "var(--surface-warm)",
              color: "var(--navy-700)",
              letterSpacing: "var(--track-caps)",
            }}
          >
            {category}
          </span>
        )}
        {popular && (
          <span
            className="rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold uppercase"
            style={{
              background: "var(--gold-100)",
              color: "var(--gold-600)",
              letterSpacing: "var(--track-caps)",
            }}
          >
            Most chosen
          </span>
        )}
      </div>

      <h3 className="card-title">
        <Link href={href}>{item.title}</Link>
      </h3>

      {itemSummary(item) && (
        <p className="line-clamp-3" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
          {itemSummary(item)}
        </p>
      )}

      {/* Pushed to the bottom so every card in a row ends the same way. */}
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        {price && (
          <p className="leading-none">
            <span
              className="font-[family-name:var(--font-serif)]"
              style={{ fontSize: "var(--text-h3)", color: "var(--navy-700)" }}
            >
              {money(price, field(item, "currency"))}
            </span>
            {frequency && (
              <span className="ml-1" style={{ color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
                {frequency.toLowerCase() === "one-time" ? "once" : frequency.toLowerCase()}
              </span>
            )}
          </p>
        )}

        <Link href={href} className="btn btn-gold shrink-0">
          Offer seva
        </Link>
      </div>
    </article>
  );
}

/** One post. The picture is most of the reason anyone opens it. */
export function PostCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const tags = Array.isArray(item.fields?.tags) ? (item.fields.tags as string[]) : [];
  const date = when(item.publishedAt ?? item.createdAt);

  return (
    <article className="card flex flex-col gap-3">
      <Link href={href} className="block">
        <Cover src={itemImage(item)} alt={item.title} />
      </Link>

      {(tags[0] || date) && (
        <p
          className="flex flex-wrap items-center gap-2 text-[11px] uppercase"
          style={{ color: "var(--ink-400)", letterSpacing: "var(--track-caps)" }}
        >
          {tags[0] && <span style={{ color: "var(--gold-600)" }}>{tags[0]}</span>}
          {tags[0] && date && <span aria-hidden>·</span>}
          {date && <time dateTime={item.publishedAt ?? item.createdAt}>{date}</time>}
        </p>
      )}

      <h3 className="card-title">
        <Link href={href}>{item.title}</Link>
      </h3>

      {itemSummary(item) && (
        <p className="line-clamp-3" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
          {itemSummary(item)}
        </p>
      )}

      <Link
        href={href}
        className="mt-auto pt-1 text-sm font-semibold"
        style={{ color: "var(--navy-700)" }}
      >
        Read on →
      </Link>
    </article>
  );
}

/** One gaushala. Where it is, and how many cows are in it. */
export function GaushalaCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const place = [field(item, "city"), field(item, "region")].filter(Boolean).join(", ");
  const cows = field(item, "cowsInCare");
  const capacity = field(item, "capacity");

  return (
    <article className="card flex flex-col gap-3">
      <Link href={href} className="block">
        <Cover src={itemImage(item)} alt={item.title} />
      </Link>

      <h3 className="card-title">
        <Link href={href}>{field(item, "name") || item.title}</Link>
      </h3>

      {place && (
        <p style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>{place}</p>
      )}

      {cows && (
        <p className="mt-auto pt-2" style={{ fontSize: "var(--text-sm)" }}>
          <span
            className="font-[family-name:var(--font-serif)]"
            style={{ fontSize: "var(--text-h4)", color: "var(--navy-700)" }}
          >
            {cows}
          </span>
          <span style={{ color: "var(--ink-400)" }}>
            {" "}
            cows in care{capacity ? ` of ${capacity}` : ""}
          </span>
        </p>
      )}
    </article>
  );
}

/** Anything else the workspace publishes. */
export function ItemCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const image = itemImage(item);

  return (
    <article className="card flex flex-col gap-3">
      {image && (
        <Link href={href} className="block">
          <Cover src={image} alt={item.title} />
        </Link>
      )}

      <h3 className="card-title">
        <Link href={href}>{item.title}</Link>
      </h3>

      {itemSummary(item) && (
        <p className="line-clamp-3" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
          {itemSummary(item)}
        </p>
      )}
    </article>
  );
}

/** The card a type deserves, by what its items actually carry. */
export function CardFor({ item, type }: { item: CmsItem; type: CmsType }) {
  if (type.key === "product") return <SevaCard item={item} type={type} />;
  if (type.key === "blog") return <PostCard item={item} type={type} />;
  if (type.key === "location") return <GaushalaCard item={item} type={type} />;
  return <ItemCard item={item} type={type} />;
}
