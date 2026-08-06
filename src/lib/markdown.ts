import { marked } from "marked";

/**
 * A CMS body, as prose and blocks.
 *
 * Authors write `:::stat`, `:::card`, `:::step`, `:::col` and the rest inside a
 * Markdown body. A run of them is one grid - four stats across, three steps,
 * twelve feature cards - so the body comes back as segments rather than one
 * string of HTML, and consecutive blocks are grouped into the run they were
 * written as.
 *
 * Blocks nest. `:::col 6` holding two cards is two columns of cards, and the
 * inner fences are parsed the same way as the outer ones, to any depth.
 *
 * Any fence this file has not styled still renders as a card. A site cannot
 * know which blocks a workspace will invent, and the alternative is `:::thing`
 * reaching a reader as literal text.
 */

/**
 * A fence opening a block.
 *
 * The space after the colons is optional - `:::col 6` and `:::col 6` are the
 * same thing to an author, and only one of them used to render.
 *
 * The argument is a width in twelfths for most kinds, and a form's key for
 * `:::form contact`, so it is captured as a word and read according to the
 * kind rather than as a number.
 */
const OPEN = /^:::[ \t]*([a-z][a-z0-9-]*)[ \t]*([A-Za-z0-9_-]{0,48})[ \t]*$/i;

/** A fence closing one. Nothing after the colons. */
const CLOSE = /^:::[ \t]*$/;

/**
 * `[INTERNAL-LINK-CARD: Label -> /path]`, on a line of its own.
 *
 * Authors write these in runs - three or four together under a "where to go
 * next" heading - so they render as one grid of cards like any other run.
 */
const LINK_CARD = /^\[INTERNAL-LINK-CARD:[ \t]*([^\]]+?)[ \t]*(?:→|->)[ \t]*(\S+?)[ \t]*\]$/i;

/** Handled elsewhere: FAQs get their own section, forms need fields. */
const LIFTED = new Set(["faq", "form"]);

/** Widths in twelfths when the author does not say. */
const DEFAULT_SPAN: Record<string, number> = { stat: 3, card: 4, step: 4, quote: 6, col: 6 };

export type Block = {
  kind: string;
  span: number;
  /** The block's own prose. Empty when it holds only other blocks. */
  html: string;
  /** Blocks written inside this one. */
  children: Block[];
  /** Set on link cards, which are a destination rather than a body. */
  href?: string;
  label?: string;
  /** Set on a `:::form` written inside another block, so it can be mounted
   *  where it sits rather than lifted to the top of the page. */
  formKey?: string;
};

export type Segment =
  | { kind: "prose"; html: string }
  | { kind: "blocks"; blocks: Block[] }
  /** A `:::form <key>` fence. The fields come from the CMS, so it is mounted
   *  as a component rather than rendered here as a string. */
  | { kind: "form"; formKey: string; heading: string; intro: string };

/**
 * Undo the old site's image URLs.
 *
 * This content was migrated out of a Next app, and its bodies carry the
 * optimizer's own URLs verbatim - `/_next/image?url=<encoded>&w=3840&dpl=...`.
 * Those point at a build that no longer exists, so nine images across the pages
 * rendered as broken icons with their alt text showing.
 *
 * Unwrapped back to whatever was inside: a media.tintorch.com URL works
 * immediately, and a root-relative one resolves against this site, where the
 * four files it names now live in public/.
 */
export function unwrapMigratedImages(md: string): string {
  return md.replace(
    /\/_next\/image\?url=([^)\s"']+)/g,
    (whole, encoded: string) => {
      // The optimizer's own parameters follow the url; they are not part of it.
      const [url] = encoded.split("&");
      try {
        return decodeURIComponent(url ?? "") || whole;
      } catch {
        return whole;
      }
    },
  );
}

const toHtml = (md: string) => marked.parse(unwrapMigratedImages(md.trim()), { async: false }) as string;

/** A node in the body, before it is grouped into segments. */
type Node =
  | { type: "prose"; markdown: string }
  | { type: "block"; kind: string; arg: string; children: Node[] }
  | { type: "link"; href: string; label: string };

/**
 * Lines to nodes, following nesting.
 *
 * A regex cannot do this: `([\s\S]*?)^:::$` is lazy, so a `:::col` holding a
 * `:::card` closed at the card's fence and the rest of the column leaked. This
 * counts depth instead, so a block ends at its own closing fence and not at the
 * first one it meets.
 */
function parse(lines: string[], from = 0, until?: string): { nodes: Node[]; next: number } {
  const nodes: Node[] = [];
  let prose: string[] = [];
  let index = from;

  const flushProse = () => {
    const markdown = prose.join("\n");
    if (markdown.trim()) nodes.push({ type: "prose", markdown });
    prose = [];
  };

  while (index < lines.length) {
    const line = lines[index]!;

    if (until && CLOSE.test(line)) {
      flushProse();
      return { nodes, next: index + 1 };
    }

    const open = OPEN.exec(line);
    if (open) {
      flushProse();
      const inner = parse(lines, index + 1, open[1]);
      nodes.push({
        type: "block",
        kind: open[1]!.toLowerCase(),
        arg: (open[2] ?? "").trim(),
        children: inner.nodes,
      });
      index = inner.next;
      continue;
    }

    const card = LINK_CARD.exec(line.trim());
    if (card) {
      flushProse();
      nodes.push({ type: "link", href: card[2]!, label: card[1]! });
      index += 1;
      continue;
    }

    prose.push(line);
    index += 1;
  }

  flushProse();
  return { nodes, next: index };
}

/** A parsed block, and anything nested inside it. */
function toBlock(node: Extract<Node, { type: "block" }>): Block {
  const asked = Number.parseInt(node.arg, 10);
  const span =
    Number.isFinite(asked) && asked > 0 ? Math.min(12, asked) : (DEFAULT_SPAN[node.kind] ?? 12);

  const prose = node.children
    .filter((child): child is Extract<Node, { type: "prose" }> => child.type === "prose")
    .map((child) => child.markdown)
    .join("\n\n");

  return {
    kind: node.kind,
    span,
    html: prose.trim() ? toHtml(prose) : "",
    children: node.children.flatMap((child) => {
      if (child.type === "link") {
        return [{ kind: "link", span: 4, html: "", children: [], href: child.href, label: child.label }];
      }
      if (child.type !== "block" || child.kind === "faq") return [];

      /*
       * A form inside a column stays there. Lifting it out - which is what
       * happens to one written at the top level - would take the right-hand
       * half of a two-column row and drop it below the row entirely.
       */
      if (child.kind === "form") {
        const inner = toBlock(child);
        return [{ ...inner, span: 12, formKey: child.arg.toLowerCase() }];
      }
      return [toBlock(child)];
    }),
  };
}

export function renderBody(md: string): Segment[] {
  const source = (md ?? "").trim();
  if (!source) return [];

  const { nodes } = parse(source.split("\n"));
  const segments: Segment[] = [];
  let run: Block[] = [];

  const flushRun = () => {
    if (run.length) segments.push({ kind: "blocks", blocks: run });
    run = [];
  };

  for (const node of nodes) {
    if (node.type === "prose") {
      flushRun();
      segments.push({ kind: "prose", html: toHtml(node.markdown) });
      continue;
    }

    if (node.type === "link") {
      run.push({ kind: "link", span: 4, html: "", children: [], href: node.href, label: node.label });
      continue;
    }

    if (node.kind === "faq") continue;

    if (node.kind === "form") {
      flushRun();
      const lines = node.children
        .flatMap((child) => (child.type === "prose" ? child.markdown.split("\n") : []))
        .map((line) => line.trim())
        .filter(Boolean);
      const headingAt = lines.findIndex((line) => /^#{1,6}\s/.test(line));

      segments.push({
        kind: "form",
        formKey: node.arg.toLowerCase(),
        heading: headingAt >= 0 ? lines[headingAt]!.replace(/^#{1,6}\s*/, "") : "",
        intro: lines.filter((_, at) => at !== headingAt).join(" "),
      });
      continue;
    }

    run.push(toBlock(node));
  }

  flushRun();
  return segments;
}

/** One body as plain HTML, for places that cannot lay out a grid. */
export function renderMarkdown(md: string): string {
  const flatten = (blocks: Block[]): string =>
    blocks.map((block) => block.html + flatten(block.children)).join("");

  return renderBody(md)
    .map((segment) => {
      if (segment.kind === "prose") return segment.html;
      if (segment.kind === "blocks") return flatten(segment.blocks);
      return "";
    })
    .join("");
}

/** A body with every block fence removed, for summaries and feeds. */
export function stripBlocks(md: string): string {
  return renderBody(md)
    .map((segment) => (segment.kind === "prose" ? segment.html : ""))
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The first sentence or so of a body, for a card or a meta description. */
export function excerpt(md: string, max = 200): string {
  const text = stripBlocks(md);
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max) || max).trim()}…`;
}
