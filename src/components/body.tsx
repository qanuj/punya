import Link from "next/link";
import { CmsForm } from "@/components/cms-form";
import { getForm, type CmsFaq, type CmsForm as CmsFormDefinition } from "@/lib/cms";
import { renderBody, renderMarkdown, type Block } from "@/lib/markdown";

/**
 * A CMS body: prose at reading width, each run of authored blocks as the grid
 * it was written as, and forms mounted where their fence sits.
 */
export async function Body({ markdown, wide = false }: { markdown: string; wide?: boolean }) {
  const segments = renderBody(markdown);
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
              className={wide ? "prose prose-wide" : "prose"}
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
export function Faqs({ faqs }: { faqs: CmsFaq[] }) {
  if (!faqs.length) return null;

  const groups: { title: string; items: CmsFaq[] }[] = [];
  for (const faq of faqs) {
    const title = faq.group?.trim() ?? "";
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(faq);
    else groups.push({ title, items: [faq] });
  }

  return (
    <div className="space-y-8">
      {groups.map((group, index) => (
        <div key={index}>
          {group.title && <h3 className="mb-3" style={{ fontSize: "var(--text-h4)" }}>{group.title}</h3>}
          <div
            className="overflow-hidden rounded-[var(--radius-lg)]"
            style={{ border: "1px solid var(--border-warm)", background: "var(--surface-card)" }}
          >
            {group.items.map((faq, at) => (
              <details
                key={at}
                style={{ borderTop: at ? "1px solid var(--border-warm)" : undefined }}
              >
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
        </div>
      ))}
    </div>
  );
}
