import Image from "next/image";
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
               * Contained rather than cropped, and given a height rather than
               * a width: these arrive at whatever size and shape the sponsor
               * supplied, and a row only reads as a row if they share a
               * baseline. Large enough to be a mark rather than a favicon -
               * at 48px they were smaller than the body text beside them,
               * which is not how you thank the people paying for the feed.
               */
              <span className="relative block h-20 w-[12rem] sm:h-24 sm:w-[15rem]">
                <Image
                  src={logo}
                  alt={name}
                  fill
                  sizes="(min-width: 640px) 15rem, 12rem"
                  className="object-contain object-left"
                />
              </span>
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
