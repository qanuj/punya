import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  field,
  getItem,
  itemBody,
  itemImage,
  itemSummary,
  listItems,
  type CmsItem,
} from "@/lib/cms";
import { Body } from "@/components/body";
import { DonateForm } from "@/components/donate-form";
import { razorpayConfigured, rupees } from "@/lib/razorpay";

/**
 * Giving.
 *
 * A route of its own rather than another CMS page, because taking money is
 * mechanism and mechanism belongs in code - but the words are still the
 * trust's, read from the `donate` page in the CMS, so what this page says can
 * be changed without a deploy.
 *
 * `?seva=<slug>` names one of the published seva. The page then shows what is
 * being given to, at the amount the trust set, which is how every "Offer this
 * seva" link on the site arrives here.
 */

export const dynamic = "force-dynamic";

type Params = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function words(): Promise<CmsItem | null> {
  return getItem("page", "donate");
}

/** The seva a link named, if it names one that is actually published. */
async function chosenSeva(slug: string): Promise<CmsItem | null> {
  if (!slug) return null;
  return getItem("product", slug);
}

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { seva } = await searchParams;
  const item = await chosenSeva(typeof seva === "string" ? seva : "");
  const page = await words();

  const title = item ? `Offer ${field(item, "name") || item.title}` : page?.seo?.metaTitle || page?.title || "Donate";

  return {
    title,
    description:
      item ? itemSummary(item) : page?.seo?.metaDescription || (page ? itemSummary(page) : undefined),
    // One page, many query strings: the canonical is the bare one.
    alternates: { canonical: "/donate" },
    robots: { index: true, follow: true },
  };
}

export default async function DonatePage({ searchParams }: Params) {
  const query = await searchParams;
  const slug = typeof query.seva === "string" ? query.seva : "";

  const [page, seva] = await Promise.all([words(), chosenSeva(slug)]);

  const price = seva ? Number(field(seva, "price")) : NaN;
  const amount = Number.isFinite(price) && price > 0 ? Math.round(price) : undefined;
  const sevaName = seva ? field(seva, "name") || seva.title : "";
  const body = page ? itemBody(page) : "";

  return (
    <article>
      <header className="section-warm" style={{ paddingBlock: "var(--space-8)" }}>
        <div className="shell">
          <h1 className="max-w-3xl" style={{ fontSize: "var(--text-h1)", lineHeight: "var(--lh-tight)" }}>
            {seva ? sevaName : page?.title || "Offer your seva"}
          </h1>
          <p className="mt-4 max-w-2xl" style={{ color: "var(--ink-600)", fontSize: "var(--text-body-lg)" }}>
            {seva
              ? itemSummary(seva) ||
                "Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala."
              : (page && itemSummary(page)) ||
                "Every contribution is recorded in the Punya app, with daily photos and updates from the gaushala."}
          </p>

          {seva && (
            <p className="mt-4">
              <Link href="/donate" style={{ color: "var(--navy-700)", fontWeight: 600 }}>
                ← Give to the gaushala instead
              </Link>
            </p>
          )}
        </div>
      </header>

      <div className="section">
        {/*
         * The form leads and what is being given to sits beside it. A donor who
         * arrived from a seva already knows what they are giving to; a donor
         * who arrived from the menu is choosing, and the panel is what tells
         * them what a gift does.
         */}
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <div className="min-w-0 max-w-xl">
            {!razorpayConfigured && (
              <p
                className="mb-6 rounded-[var(--radius-md)] p-4"
                style={{ background: "var(--surface-warm)", border: "1px solid var(--border-warm)" }}
              >
                Online giving is not switched on for this deployment yet. The form below will say so
                rather than take a payment it cannot complete.
              </p>
            )}

            <DonateForm
              seva={seva ? seva.slug : undefined}
              sevaName={sevaName || undefined}
              defaultAmount={amount}
            />
          </div>

          <aside className="lg:sticky lg:top-8">{seva ? <SevaPanel item={seva} /> : <SevaPicker />}</aside>
        </div>
      </div>

      {body && (
        <div className="section section-cream">
          <div className="shell">
            <Body markdown={body} wide />
          </div>
        </div>
      )}
    </article>
  );
}

/** What this donor picked, so the amount on the form has a face. */
function SevaPanel({ item }: { item: CmsItem }) {
  const image = itemImage(item);
  const price = Number(field(item, "price"));
  const frequency = field(item, "frequency");

  return (
    <div className="card flex flex-col gap-4">
      {image && (
        <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)]">
          <Image src={image} alt={item.title} fill sizes="352px" className="object-cover" />
        </div>
      )}

      <h2 className="card-title">{field(item, "name") || item.title}</h2>

      {Number.isFinite(price) && price > 0 && (
        <p className="leading-none">
          <span
            className="font-[family-name:var(--font-serif)]"
            style={{ fontSize: "var(--text-h3)", color: "var(--navy-700)" }}
          >
            {rupees(price)}
          </span>
          {frequency && (
            <span className="ml-1" style={{ color: "var(--ink-400)", fontSize: "var(--text-sm)" }}>
              {frequency.toLowerCase() === "one-time" ? "suggested, once" : frequency.toLowerCase()}
            </span>
          )}
        </p>
      )}

      {itemSummary(item) && (
        <p className="line-clamp-6" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
          {itemSummary(item)}
        </p>
      )}

      <Link
        href={`/seva/${item.slug}`}
        className="text-sm font-semibold"
        style={{ color: "var(--navy-700)" }}
      >
        Read about this seva →
      </Link>
    </div>
  );
}

/** For a donor who arrived with nothing chosen: what others choose. */
async function SevaPicker() {
  const { items } = await listItems("product", {
    limit: 24,
    fields: "title,name,price,currency,frequency,popular,summary",
  });

  const popular = items.filter((item) => item.fields?.popular === true).slice(0, 4);
  if (!popular.length) return null;

  return (
    <div
      className="rounded-[var(--radius-md)] p-6"
      style={{ background: "var(--surface-warm)", border: "1px solid var(--border-warm)" }}
    >
      <h2 style={{ fontSize: "var(--text-h4)" }}>Most chosen seva</h2>
      <p className="mt-2" style={{ color: "var(--ink-600)", fontSize: "var(--text-sm)" }}>
        Give to the gaushala as a whole above, or offer one of these.
      </p>

      <ul className="mt-4 space-y-3">
        {popular.map((item) => {
          const price = Number(field(item, "price"));
          return (
            <li key={item.id}>
              <Link href={`/donate?seva=${item.slug}`} className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold" style={{ color: "var(--navy-700)" }}>
                  {field(item, "name") || item.title}
                </span>
                {Number.isFinite(price) && price > 0 && (
                  <span className="shrink-0 text-sm" style={{ color: "var(--ink-400)" }}>
                    {rupees(price)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link href="/seva" className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--navy-700)" }}>
        All seva →
      </Link>
    </div>
  );
}
