import { field, type CmsItem } from "@/lib/cms";

/**
 * The people paying for the work, as their marks.
 *
 * Not cards: a sponsor has a logo and a name and nothing else worth a card -
 * no summary, no price, no date - and the generic card renders a title over
 * white space and links to a page with the same title on it. A row of marks is
 * what this is for, and what every reader already recognises it as.
 *
 * Deliberately not linked. A sponsor's own site is not something this trust
 * vouches for, the items carry no URL to link to anyway, and a logo that goes
 * nowhere is honest about being an acknowledgement rather than an ad.
 *
 * A sponsor with no artwork is named in words instead. The alternative is a
 * gap in the row, which reads as a broken image rather than as a supporter.
 */
export function SponsorRow({ items }: { items: CmsItem[] }) {
  if (items.length === 0) return null;

  return (
    /*
     * Left, with the heading, rather than centred in the band. Two marks
     * floating in the middle of a 1200px row read as leftovers; under the
     * words that introduce them they read as the answer to those words.
     */
    <ul className="flex flex-wrap items-center gap-x-14 gap-y-10 sm:gap-x-20">
      {items.map((item) => {
        const logo = field(item, "picture") || field(item, "logo") || field(item, "image");
        const name = field(item, "title") || item.title;

        return (
          <li key={item.id} className="flex items-center justify-center">
            {logo ? (
              /*
               * Sized by its own shape: a height, and whatever width that
               * makes. A fixed box does not work here because a sponsor
               * supplies whatever they have - both of these are square, and
               * fitting a square into a 240x96 box drew it at 96px with 144px
               * of nothing beside it, which read as a cropped logo.
               *
               * A plain img rather than next/image: with no intrinsic size to
               * declare, `fill` needs exactly the fixed box this is avoiding.
               * These are small marks on our own media host, so there is
               * nothing for the optimizer to save.
               */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={name}
                loading="lazy"
                decoding="async"
                className="h-24 w-auto max-w-[14rem] object-contain sm:h-28 sm:max-w-[16rem]"
              />
            ) : (
              <span
                className="font-[family-name:var(--font-serif)]"
                style={{ fontSize: "var(--text-h3)", color: "var(--ink-600)" }}
              >
                {name}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
