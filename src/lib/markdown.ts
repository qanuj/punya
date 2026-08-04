import { marked } from "marked";

/**
 * The CMS body, as HTML.
 *
 * Authors write `:::card`, `:::stat`, `:::quote` and the rest inside a Markdown
 * body. Any fence this file did not know about would otherwise reach the page
 * as the literal text ":::card 4", so every fence is handled the same way -
 * whatever its name - and an unrecognised one degrades to a plain section
 * rather than leaking. A template cannot know which blocks a workspace will
 * invent, so it must not need to.
 */

/** `:::kind [size] … :::`, with the kind and optional width captured. */
const FENCE = /^:::([a-z][a-z0-9-]*)[ \t]*([0-9]{0,2})[ \t]*\n([\s\S]*?)^:::[ \t]*$/gim;

/** Blocks handled elsewhere and removed rather than rendered inline. */
const LIFTED = new Set(["faq", "form"]);

function expandBlocks(md: string): string {
  return md.replace(FENCE, (_all, kind: string, size: string, inner: string) => {
    const name = kind.toLowerCase();

    // FAQs render as their own section from the parsed `faqs`, and a form
    // needs fields this renderer does not have. Both would duplicate or break.
    if (LIFTED.has(name)) return "";

    const width = Number.parseInt(size, 10);
    const span = Number.isFinite(width) && width > 0 ? Math.min(12, width) : 12;
    const body = marked.parse(inner.trim(), { async: false }) as string;

    return `\n<section class="tc-block tc-block--${name}" data-span="${span}">${body}</section>\n`;
  });
}

export function renderMarkdown(md: string): string {
  const source = (md ?? "").trim();
  if (!source) return "";
  // Blocks first: their inner Markdown is rendered as it is lifted out, so the
  // outer pass only ever sees prose and the HTML already produced.
  return marked.parse(expandBlocks(source), { async: false }) as string;
}

/** A body with every block fence removed, for summaries and feeds. */
export function stripBlocks(md: string): string {
  return (md ?? "").replace(FENCE, "").trim();
}

/** The first sentence or so of a body, for a card or a meta description. */
export function excerpt(md: string, max = 200): string {
  const text = stripBlocks(md)
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max) || max).trim()}…`;
}
