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

/**
 * The amount, split so the symbol and the number can be set separately.
 *
 * "₹2,100" in one run of Playfair puts a complex glyph at the same weight as
 * the digits that matter, and at card sizes the rupee sign is what a reader
 * loses first. Two spans: the symbol can sit smaller or in another colour
 * while the number carries the size.
 */
function currencySymbol(currency: string): string {
  const formatted = money("0", currency);
  return formatted.replace(/[\d.,\s]/g, "") || "₹";
}

function amountDigits(amount: string, currency: string): string {
  return money(amount, currency).replace(/[^\d.,]/g, "");
}

/** "one-time" and "monthly" as a donor would read them on a receipt. */
function periodLabel(frequency: string): string {
  const value = (frequency || "").toLowerCase();
  if (!value) return "";
  if (value === "one-time" || value === "once") return "One-time gift";
  if (value === "monthly") return "Every month";
  if (value === "yearly" || value === "annual") return "Every year";
  return frequency;
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
 * One seva, in the same tile a post takes.
 *
 * Two card designs for two content types made the catalogue and the writing
 * look like two sites. The seva keeps what only it has - the amount, the
 * frequency, the category - and takes the blog tile for everything else. The
 * amount is a line of the tile rather than a slip with a button, so the tile
 * itself is the only thing to click, as on a post.
 */
export function SevaCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const price = field(item, "price");
  const frequency = field(item, "frequency");
  const category = field(item, "category");
  const popular = item.fields?.popular === true;

  const symbol = currencySymbol(field(item, "currency"));
  const digits = amountDigits(price, field(item, "currency"));
  const period = periodLabel(frequency);

  return (
    <article className="post">
      <Link href={href} className="post-link">
        <span className="post-media">
          {itemImage(item) && (
            <Image
              src={itemImage(item)}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          )}
        </span>

        <span className="post-body">
          <span className="post-rule" aria-hidden />
          <span className="post-title block">{item.title}</span>

          <span className="post-amount">
            <span className="post-sym">{symbol}</span>
            <span className="post-num">{digits}</span>
            {period && <span className="post-period">{period.toLowerCase()}</span>}
          </span>

          {itemSummary(item) && (
            <span className="meta line-clamp-2 block">{itemSummary(item)}</span>
          )}

          <span className="post-meta flex flex-wrap items-center gap-2">
            {category && <span className="chip">{category}</span>}
            {popular && <span className="chip chip-gold">Most chosen</span>}
          </span>
        </span>
      </Link>
    </article>
  );
}

/** One post. The picture is most of the reason anyone opens it. */
export function PostCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const tags = Array.isArray(item.fields?.tags) ? (item.fields.tags as string[]) : [];
  const date = when(item.publishedAt ?? item.createdAt);

  const image = itemImage(item);
  const stamp = item.publishedAt ?? item.createdAt;

  return (
    <article className="post">
      <Link href={href} className="post-link">
        <span className="post-media">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          )}
        </span>

        <span className="post-body">
          <span className="post-rule" aria-hidden />
          <span className="post-title block">{item.title}</span>
          {itemSummary(item) && (
            <span className="meta line-clamp-2 block">{itemSummary(item)}</span>
          )}

          <span className="label-caps post-meta">
            {tags[0] && <span style={{ color: "var(--gold-text)" }}>{tags[0]}</span>}
            {tags[0] && date && <span aria-hidden>·</span>}
            {date && <time dateTime={stamp}>{date}</time>}
          </span>
        </span>
      </Link>
    </article>
  );
}

/** One gaushala: where it is, and how many cows are living in it. */
export function GaushalaCard({ item, type }: { item: CmsItem; type: CmsType }) {
  const href = itemPath(type, item.slug);
  const place = [field(item, "city"), field(item, "region")].filter(Boolean).join(", ");
  const cows = field(item, "cowsInCare");
  const capacity = field(item, "capacity");

  return (
    <article className="post">
      <Link href={href} className="post-link">
        <span className="post-media">
          {itemImage(item) && (
            <Image
              src={itemImage(item)}
              alt=""
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
              className="object-cover"
            />
          )}
        </span>

        <span className="post-body">
          <span className="post-rule" aria-hidden />
          <span className="post-title block">{field(item, "name") || item.title}</span>
          {place && <span className="meta block">{place}</span>}

          {cows && (
            <span className="post-amount post-meta">
              <span className="post-num">{cows}</span>
              <span className="post-period">
                cows in care{capacity ? ` of ${capacity} places` : ""}
              </span>
            </span>
          )}
        </span>
      </Link>
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
        <p className="meta line-clamp-3">
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
