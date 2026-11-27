import Link from "next/link";
import { CmsForm } from "@/components/cms-form";
import { EmbedBlock } from "@/components/embed-block";
import { embedFromHtml } from "@/lib/embeds";
import { splitFaqBlocks } from "@tintorch/web/markdown";
import { getForm, type CmsFaq, type CmsForm as CmsFormDefinition } from "@/lib/cms";
import { renderBody, renderMarkdown, type Block } from "@/lib/markdown";

/**
 * A CMS body: prose at reading width, each run of authored blocks as the grid
 * it was written as, and forms mounted where their fence sits.
 *
 * `wide` is for a body that owns the whole shell rather than a column beside a
 * sidebar - a contact page, a page of cards. Prose still holds its measure,
 * because 1200px of running text is not readable at any width, but it is
 * centred and the authored blocks take the full width they were written for: a
 * row of `:::card 4` in a 72ch column is three cards of 180px, which is how
 * the contact page ended up wrapping its own address over three lines.
 */
export async function Body({ markdown, wide = false }: { markdown: string; wide?: boolean }) {
  /*
   * The FAQ heading goes with the questions it introduced.
   *
   * The CMS parses `:::faq` fences into the item's own `faqs` and leaves them
   * in the body as well, and this parser lifts them out - so the heading an
   * author wrote above them, "Frequently asked questions", was left behind
   * introducing nothing, directly above the FAQ section's own heading. Two
   * headings in a row saying the same thing, on every item that has questions.
   *
   * `splitFaqBlocks` takes the fences and that heading together. The questions
   * are not lost: they arrive separately as `item.faqs` and are rendered by
   * FaqSection.
   */
  const segments = renderBody(splitFaqBlocks(markdown).body);
  if (!segments.length) return null;

  /*
   * Every form the body names, at any depth, fetched once each. A form written
   * inside a column is a block rather than a segment, so both are collected.
   */
  const fromBlocks = (blocks: Block[]): string[] =>
    blocks.flatMap((block) => [
      ...(block.formKey ? [block.formKey] : []),
      ...fromBlocks(block.children),
    ]);

  const keys = [
    ...new Set(
      segments.flatMap((segment) =>
        segment.kind === "form"
          ? [segment.formKey]
          : segment.kind === "blocks"
            ? fromBlocks(segment.blocks)
            : [],
      ),
    ),
  ];
  const forms = new Map(await Promise.all(keys.map(async (key) => [key, await getForm(key)] as const)));

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "prose") {
          return (
            <div
              key={index}
              className={wide ? "prose mx-auto" : "prose"}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }

        if (segment.kind === "form") {
          const form = forms.get(segment.formKey);
          // A fence naming a form that does not exist renders nothing, rather
          // than an empty card or the fence itself.
          if (!form) return null;

          return (
            <div key={index} className="mx-auto mt-8 max-w-xl">
              {(segment.heading || segment.intro) && (
                <div className="mb-5 text-center">
                  {segment.heading && (
                    <h2 style={{ fontSize: "var(--text-h2)" }}>{segment.heading}</h2>
                  )}
                  {segment.intro && (
                    <p className="mt-2" style={{ color: "var(--text-muted)" }}>
                      {segment.intro}
                    </p>
                  )}
                </div>
              )}
              <CmsForm form={form} />
            </div>
          );
        }

        return (
          <div key={index} className="blocks">
            {segment.blocks.map((block, at) => (
              <BlockView key={at} block={block} forms={forms} />
            ))}
          </div>
        );
      })}
    </>
  );
}

/** One authored block. Link cards are a destination, so they are anchors. */
function BlockView({
  block,
  forms,
}: {
  block: Block;
  forms: Map<string, CmsFormDefinition | null>;
}) {
  if (block.kind === "link" && block.href) {
    return (
      <Link
        href={block.href}
        data-span={block.span}
        className="block block-link"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          background: "var(--surface-card)",
          border: "1px solid var(--border-warm)",
          boxShadow: "var(--shadow-card)",
          padding: "var(--space-5)",
          fontWeight: 600,
          color: "var(--text-heading)",
        }}
      >
        <span>{block.label}</span>
        <span aria-hidden style={{ color: "var(--brand-accent)" }}>
          →
        </span>
      </Link>
    );
  }

  /*
   * A block holding other blocks - `:::col 6` with two cards inside - renders
   * its own prose first, then the nested run as a grid of its own. A column
   * carries no card chrome; it exists to divide the row.
   */
  /*
   * An `:::embed` fence: a map, a video, or a link with words on it. Never a
   * frame around a URL this site has not recognised.
   */
  if (block.kind === "embed") {
    const embed = embedFromHtml(block.html);
    if (embed) {
      return (
        <div data-span={block.span} className="block block-embed">
          <EmbedBlock embed={embed} />
        </div>
      );
    }
  }

  /* A form written inside a column, mounted where it sits. */
  if (block.formKey) {
    const form = forms.get(block.formKey);
    if (!form) return null;

    return (
      <div data-span={block.span} className="block block-form">
        {block.html && (
          <div className="mb-4" dangerouslySetInnerHTML={{ __html: block.html }} />
        )}
        <CmsForm form={form} />
      </div>
    );
  }

  if (block.children.length > 0) {
    return (
      <div data-span={block.span} className={`block block-${block.kind}`}>
        {block.html && <div dangerouslySetInnerHTML={{ __html: block.html }} />}
        <div className="blocks">
          {block.children.map((child, at) => (
            <BlockView key={at} block={child} forms={forms} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-span={block.span}
      className={`block block-${block.kind}`}
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  );
}

/**
 * The questions, grouped as they were written.
 *
 * No heading of its own: the body already ends with the one the author wrote -
 * "Questions, answered", "Pricing questions, answered" - and adding a second
 * put two headings in a row saying the same thing.
 */
export function Faqs({ faqs, columns = 1 }: { faqs: CmsFaq[]; columns?: 1 | 2 }) {
  const groups = groupFaqs(faqs);
  if (!groups.length) return null;

  return (
    <div className="space-y-8">
      {groups.map((group, index) => (
        <div key={index}>
          {group.title && <h3 className="mb-3" style={{ fontSize: "var(--text-h4)" }}>{group.title}</h3>}
          <FaqPanels items={group.items} columns={columns} />
        </div>
      ))}
    </div>
  );
}

/**
 * The questions as a page shows them, wherever the page is.
 *
 * Every page's questions used to be laid out by whoever rendered them: the
 * home page in one band with a heading, an article in another band with none,
 * one in a single column and one in two. They are the same thing on every
 * page, so they are one component - a warm band closing the page, a heading
 * the section owns, and two panels on a wide screen.
 *
 * The group title is the body heading the questions were written under, which
 * on a page with one group is either the section's own heading repeated or the
 * last thing the author happened to be writing about. It earns a sub-heading
 * only where there is more than one group to tell apart.
 */
export function FaqSection({ faqs, blurb }: { faqs: CmsFaq[]; blurb?: string }) {
  const groups = groupFaqs(faqs);
  if (!groups.length) return null;

  const shown = groups.length > 1 ? faqs : faqs.map((faq) => ({ ...faq, group: undefined }));

  return (
    <section className="section section-warm">
      {/*
       * The same questions, in the form a search engine reads.
       *
       * A rich result for a page like this is a dozen answers shown before
       * anyone clicks, and an answer engine quoting the trust rather than
       * guessing on its behalf. The markup is generated from the same FAQs the
       * page renders, so the two cannot drift apart.
       */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: plain(faq.answer) },
            })),
          }),
        }}
      />

      <div className="shell">
        <div className="mb-8 max-w-2xl">
          <h2 style={{ fontSize: "var(--text-h2)" }}>Questions, answered</h2>
          {blurb && (
            <p className="mt-2" style={{ color: "var(--ink-600)" }}>
              {blurb}
            </p>
          )}
        </div>

        <Faqs faqs={shown} columns={2} />
      </div>
    </section>
  );
}

/**
 * An answer as text.
 *
 * Schema.org takes the answer as a string, and what is stored is markdown -
 * so the links and the bold come out as words rather than as syntax.
 */
function plain(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The questions in the runs they were written in. */
function groupFaqs(faqs: CmsFaq[]): { title: string; items: CmsFaq[] }[] {
  const groups: { title: string; items: CmsFaq[] }[] = [];

  for (const faq of faqs) {
    const title = faq.group?.trim() ?? "";
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(faq);
    else groups.push({ title, items: [faq] });
  }

  return groups;
}

/**
 * One group's questions.
 *
 * A dozen collapsed questions in a single column is a column of titles with a
 * thousand pixels of nothing beside each one, so a caller with a wide section
 * to fill can ask for two. Split rather than flowed: each half is a panel of
 * its own, which keeps the hairline dividers inside a border on both sides and
 * survives a question long enough to wrap. One column on a phone, always.
 */
function FaqPanels({ items, columns }: { items: CmsFaq[]; columns: 1 | 2 }) {
  if (columns === 1 || items.length < 4) return <FaqPanel items={items} />;

  const half = Math.ceil(items.length / 2);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <FaqPanel items={items.slice(0, half)} />
      <FaqPanel items={items.slice(half)} />
    </div>
  );
}

function FaqPanel({ items }: { items: CmsFaq[] }) {
  return (
    <div
      className="h-full overflow-hidden rounded-[var(--radius-lg)]"
      style={{ border: "1px solid var(--border-warm)", background: "var(--surface-card)" }}
    >
      {items.map((faq, at) => (
        <details key={at} style={{ borderTop: at ? "1px solid var(--border-warm)" : undefined }}>
          <summary
            className="cursor-pointer list-none px-5 py-4"
            style={{ fontWeight: 600, color: "var(--text-heading)" }}
          >
            {faq.question}
          </summary>
          <div
            className="prose px-5 pb-4 text-[length:var(--text-sm)]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(faq.answer) }}
          />
        </details>
      ))}
    </div>
  );
}
