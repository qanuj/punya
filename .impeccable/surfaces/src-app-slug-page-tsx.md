---
version: 1
slug: "src-app-slug-page-tsx"
primary_target: "src/app/[[...slug]]/page.tsx"
related_targets: ["src/components/site-chrome.tsx","src/components/cards.tsx","src/components/home-sections.tsx","src/components/body.tsx","src/components/item-aside.tsx"]
---

# Public site — Punya.ngo

## Scope and mode

Whole public site: home, seva listing and detail, blog, gaushalas, About / Our Work /
Transparency / Contact, header, footer, 404, feeds and sitemap chrome. `/account` excluded.
Visitor mode: **Persuade** on home and seva surfaces; listing and item pages stay Persuade because
the seva card is the ask. Blog and long-form pages read as **Read** inside the same world.

## Audience, job, action

Devotional donor in India on a mid-range Android phone, often at an occasion. Job: perform a named
gau seva and know it was carried out. Action: choose a named seva at its exact price, pay, and be
told where the proof will appear. Second audience: NRI donor who cannot visit and needs proof.

## Chosen direction

**Painted Hoarding** — the Polish film poster world, fused as the Indian hand-painted cinema
hoarding. One painted gouache metaphor is a standing companion on every surface, torn against
poster stock that carries the real, dense, priced content. Won on the decision page over the
assigned roll (Cow Brand, matchbox chromolithography); the Station Board round was re-rolled away.

Approved comp: `.impeccable/mocks/comp-b-torn-ledger.png` (**B · The Torn Ledger**).
World seed key `38080fb2`. Quality bar: `.impeccable/refs/polish-hero.webp`, `polish-board.webp`.

**Memorable moment:** the torn seam. Every boundary between painting and content is a real deckled
tear, never a straight edge — it is the one thing a visitor would describe an hour later.

## Comp read as a design system

- **Component grammar:** painted panel · poster-stock ground · torn seam between them · row-based
  ledger (vignette, name, description, price, action) · dry-brush horizontal rule · brush-stroke
  button. No rounded rectangles, no cards with uniform radii, no bento grid.
- **Corner language:** nothing is a clean radius. Painted panels end in deckle; poster-stock blocks
  are square-cut; the only curves are painted ones.
- **Line weights:** rules are dry-brush strokes, 2–4px, irregular opacity — never a 1px hairline.
- **Elevation:** flat. There is no shadow system. Depth comes from the tear and from paint sitting
  on stock. Ban `box-shadow` for elevation entirely.
- **Type ramp:** brushed display for headlines and seva names; humanist workhorse for all reading;
  condensed caps for eyebrows, labels and prices. Devanagari and Latin are the same three faces, so
  the planned Hindi UI needs no second type system.
  - Display: **Yatra One** (Devanagari + Latin, painted/brush character, Indian).
  - Body: **Mukta** (Devanagari + Latin, humanist workhorse).
  - Label/price: **Khand** (Devanagari + Latin, condensed).
- **Palette:** indigo night `#1A1630`, bone poster stock `#E8DCC0`, muddy ochre `#C79A3E`,
  dusty violet `#6B5A8A`, shelter green `#4A6B52`, and one hot vermilion `#C8452A` reserved for the
  act of giving — the donate action and nothing else. Colour strategy: **Drenched** — indigo and
  bone own whole regions; vermilion is never a field.

## Ingredient inventory

| Region | Medium | Note |
|---|---|---|
| Standing painted panel (home, each section head) | **generated raster** | Cow in shelter at dusk; portrait crop for phone, tall for desktop. Depth, lighting, figure — raster, not CSS. |
| Seva row vignettes (8+) | **generated raster** | Small painted squares, one per seva category; real gaushala photography where the CMS returns it, painted vignette as the fallback ground. |
| Torn seam between panel and stock | **generated raster (tiling PNG w/ alpha)** | A deckled tear is drawn material. Not a CSS clip-path zigzag. |
| Poster-stock ground texture | **generated raster (tiling)** | Paper grain is a texture by name; a CSS gradient is not a texture medium. |
| Dry-brush rules | **authored SVG** | Flat, countable, scalable. |
| Brush-stroke button | **authored SVG mask over solid vermilion** | Signature material on the primary action — must be a real brushed edge, not a border trick. |
| Wordmark + supplied icon | **existing project asset** | `public/brand/logo-icon.png` is binding and never redrawn. |
| Nav, forms, controls, all copy | **semantic HTML/CSS** | Never rasterize UI text. |
| Live counts, prices, seva names | **semantic HTML from CMS** | Never baked into artwork. |

Quantity commitment: the standing panel covers a full third of desktop width at every scroll
position on home, and a full-bleed band of at least 40vh on phone. A panel rebuilt smaller than
that is a different design.

## Constraints carried in

- Nothing user-facing hardcoded; CMS owns every word, number and link.
- Devanagari beside function, never instead of it. Full Hindi UI is planned — no baked English
  strings, no English-tuned widths.
- Recurring seva is managed in the app only; site copy must not imply otherwise.
- No invented prices, counts, testimonials, press or endorsements.
- Phone first: price, seva name and action must not fall below three screens in stacked order.

## Unresolved

- Whether the standing panel is one artwork site-wide or one per section.
- Whether blog long-form keeps the panel or drops to poster stock alone.
