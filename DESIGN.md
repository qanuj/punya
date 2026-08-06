---
name: Punya.ngo
description: A gau seva trust's site — deed navy, diya gold and cream paper, where every ask names the act and its price.
colors:
  deed-navy: "#1B2C5C"
  deed-navy-deep: "#14224E"
  deed-navy-ink: "#101C3F"
  deed-navy-void: "#0C1633"
  deed-navy-mid: "#243870"
  deed-navy-wash: "#E8EDF8"
  diya-gold: "#D9952A"
  diya-gold-deep: "#C4841F"
  diya-gold-ember: "#B8791A"
  diya-gold-text: "#8F5C11"
  diya-gold-light: "#E8B45C"
  diya-gold-wash: "#F8EAD2"
  star: "#F5B301"
  cream-paper: "#FDF9F0"
  cream-warm: "#FBF3E3"
  cream-deep: "#F3E6CC"
  white: "#FFFFFF"
  ink-strong: "#1F2937"
  ink-body: "#4B5563"
  ink-quiet: "#616B7A"
  ink-muted: "#9CA3AF"
  border-warm: "#EAE2D0"
  border-cool: "#E5E7EB"
  on-dark: "#FFFFFF"
  on-dark-soft: "#B9C4E2"
  verified-green: "#2E9E4F"
  info-blue: "#2F55B8"
  danger: "#C0392B"
typography:
  hero:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.15
  display:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
  subtitle:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.7
  body-large:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Source Sans 3, Segoe UI, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.18em"
  stat:
    fontFamily: "Playfair Display, Georgia, Times New Roman, serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.15
  devanagari:
    fontFamily: "Tiro Devanagari Hindi, Noto Serif Devanagari, serif"
    fontSize: "14px"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
components:
  button-gold:
    backgroundColor: "{colors.diya-gold}"
    textColor: "{colors.deed-navy-deep}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
    typography: "{typography.body}"
  button-gold-hover:
    backgroundColor: "{colors.diya-gold-deep}"
    textColor: "{colors.deed-navy-deep}"
  button-navy:
    backgroundColor: "{colors.deed-navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-navy-hover:
    backgroundColor: "{colors.deed-navy-deep}"
    textColor: "{colors.white}"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.deed-navy}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.cream-warm}"
    textColor: "{colors.deed-navy-deep}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "24px"
  chip-category:
    backgroundColor: "{colors.cream-warm}"
    textColor: "{colors.deed-navy}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.label}"
  chip-popular:
    backgroundColor: "{colors.diya-gold-wash}"
    textColor: "{colors.diya-gold-text}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.md}"
    padding: "12px"
  stat-panel:
    backgroundColor: "{colors.deed-navy-deep}"
    textColor: "{colors.on-dark-soft}"
    rounded: "0"
    padding: "32px 24px"
  note-block:
    backgroundColor: "{colors.cream-warm}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Punya.ngo

## Overview

**Creative North Star: "The Trust Deed"**

Punya.ngo looks like an obligation formally recorded and faithfully kept. Deed navy is the ink an
undertaking is written in; cream is the paper it is written on; diya gold is the flame lit once the
seva is performed. The register is devotional but never ornamental for its own sake — the warmth
comes from paper tone and Devanagari accents, the rigour from hairline rules, exact rupee amounts
and a single unmistakable action.

The system is dense with content and light on effect. Solid surfaces only: no gradients outside a
photo fade, no blur, no glass. Photography of the cows and the gaushala does the emotional work,
and it is real photography — the design's job is to frame it cleanly and put a named seva and a
price beside it. Long-form copy runs at a genuinely readable 16.5px / 1.7 in a humanist sans,
because the site's real work is explaining where a donation goes; Playfair holds the brand at
display sizes and hands off to the sans below 22px, where its hairlines break down.

Confirmed anti-references: guilt-driven NGO fundraising (distressed imagery, red urgency banners,
countdowns, ₹1-a-day guilt framing), kitsch devotional web (garland borders, animated om GIFs,
saffron gradients, shadowed Devanagari), and crowdfunding platforms (progress bars, donor
leaderboards, share counts, urgency percentages). The trust asks on the strength of what it can
show, not on pressure.

**Key Characteristics:**
- Deed navy for trust, diya gold for the act of giving, cream for warmth, on white
- One gold call to action per view — gold is the action colour and is not spent elsewhere
- Playfair Display above 22px, Source Sans 3 at and below it
- Hairline warm borders (#EAE2D0), 12px card radius, pill buttons at a 44px touch height
- Devanagari carries devotion; English always carries the function beside it
- 96px section rhythm, 1200px shell, twelve-column author blocks that stack on a phone
- Real gaushala photography at a fixed 16:10 crop; no illustration, no stock

## Colors

A two-voice palette: an institutional navy family and a single warm gold, laid on cream and white
paper with one neutral ink ramp.

### Primary
- **Deed Navy** (`#1B2C5C`): headings, links, menu items, wordmark, outline-button strokes. The
  colour of the record. Every heading on a light surface is this, never black.
- **Deed Navy Deep** (`#14224E`): the stat band and other dark panels dropped into a light page.
- **Deed Navy Ink** (`#101C3F`): the utility topbar and the footer — the frame around the page.

### Secondary
- **Diya Gold** (`#D9952A`): the Donate action, the ornament rules, the quote's left edge, the
  "Most chosen" mark, and the focus ring. Nothing else.
- **Diya Gold Deep** (`#C4841F`): the hover state of every gold action and the hover colour of a
  link.
- **Diya Gold Wash** (`#F8EAD2`): the fill behind the "Most chosen" chip; the only tinted gold
  surface in the system.
- **Diya Gold Text** (`#8F5C11`): the only gold allowed to *be* text. The display golds are for
  fills, rules and marks; at label sizes they measure under 4:1 on white, so every gold word — a
  post's tag, the "Most chosen" label, a hovered link — takes this one instead.

### Tertiary
- **Cream Paper** (`#FDF9F0`): alternating full-bleed section grounds, so a long page reads as
  stacked sheets rather than one scroll.
- **Cream Warm** (`#FBF3E3`): note blocks, the closing-ask block, table headers, icon circles,
  image placeholders, category chips, and the outline-button hover.

### Neutral
- **Ink Strong** (`#1F2937`): long-form prose and bold runs inside it.
- **Ink Body** (`#4B5563`): secondary copy — card summaries, section blurbs, captions.
- **Ink Quiet** (`#616B7A`): the quietest text the system has — dates, units, frequencies, caps
  labels. It replaced Ink Muted in every text role, which measured 2.5:1 on white.
- **Ink Muted** (`#9CA3AF`): borders, dividers and disabled marks. **Not text.**
- **Warm Border** (`#EAE2D0`): every hairline on a light surface. The system's default rule.
- **Cool Border** (`#E5E7EB`): form field strokes and table cell rules, where a warm line would
  read as decoration.
- **On-Dark Soft** (`#B9C4E2`): secondary text on navy — topbar line, footer copy, stat labels.

### Named Rules

**The One Gold Action Rule.** Gold fills exactly one call to action per view. If a second gold
button appears, one of them is wrong — demote it to navy or outline. Gold's rarity is what makes
"Donate Now" findable without a banner.

**The Never-Black Rule.** No heading, border or panel is `#000`. Headings are deed navy, rules are
warm border, dark panels are navy. Black reads as a different brand.

**The Guilt-Free Rule.** Red exists only as `--danger` on a broken form field. It never marks
urgency, scarcity or a deadline.

**The 4.5 Rule.** Every text colour clears 4.5:1 against every surface it lands on, measured, not
estimated. Two colours exist solely because of it — Ink Quiet and Diya Gold Text — and two are
banned from text entirely: Ink Muted (2.5:1) and white on Diya Gold (2.5:1). A donor reading a
phone in sunlight is the test case, not a design tool's preview.

## Typography

**Display Font:** Playfair Display (Georgia, Times New Roman, serif)
**Body Font:** Source Sans 3 (Segoe UI, system-ui, sans-serif)
**Devanagari Font:** Tiro Devanagari Hindi (Noto Serif Devanagari, serif)

**Character:** A high-contrast didone for the brand's voice against a humanist sans that stays
comfortable over three screens of explanation. The pairing is deliberately unbalanced — the serif
appears rarely and large, the sans carries almost all the reading.

### Hierarchy
- **Hero** (Playfair, 700, 56px, 1.15): the first line of a landing surface. One per page.
- **Display** (Playfair, 700, 44px, 1.25): page titles.
- **Headline** (Playfair, 700, 32px, 1.25): section headings and the closing ask.
- **Title** (Playfair, 700, 22px, 1.25): the wordmark and sub-section headings — the smallest size
  Playfair is allowed.
- **Subtitle** (Source Sans 3, 600, 18px, 1.35, −0.01em): card titles, step names, FAQ questions.
  Sans, not serif, by rule.
- **Body** (Source Sans 3, 400, 16.5px, 1.7): all reading copy, capped at 72ch.
- **Body Large** (Source Sans 3, 400, 18px, 1.7): the lead paragraph and the closing ask's line.
- **Label** (Source Sans 3, 600, 11–12px, 0.18em, uppercase): chips, brand line, eyebrow text.
  Uppercase only with the full 0.18em track.
- **Stat** (Playfair, 700, 26px): the number inside a navy stat panel.
- **Devanagari** (Tiro Devanagari Hindi, 400, 14px, 0 tracking): devotional accent lines only.

### Named Rules

**The 22px Floor Rule.** Playfair Display is never set below 22px. At 18px its hairlines break up
and the reader slows — every heading at or under 18px is Source Sans 3 at 600.

**The Devotion-Beside-Function Rule.** A Devanagari line never carries information the visitor
needs to act. गौ सेवा · गौ संरक्षण · गौ संवर्धन sets the register; the English beside it does the
work. Never letterspace Devanagari, and never shadow or outline it.

**The Reading Ink Rule.** Long-form prose takes ink strong (`#1F2937`); ink body (`#4B5563`) is for
what sits *beside* the reading — summaries, captions, blurbs — never for the reading itself.

## Layout

A single 1200px shell (`--content-max`) with 24px inline padding, centred, used by every surface
including the header and footer bars. Vertical rhythm is one value: 96px of section padding
(`--space-9`), with grounds alternating white / cream paper / cream warm so a long page reads as
stacked sheets. Spacing steps are 4-8-12-16-24-32-48-64-96; nothing lands between them.

Author-written blocks (`:::card`, `:::stat`, `:::quote`, …) lay out on a twelve-column grid with a
24px gutter, sized in twelfths (`:::card 4` is a third of a row), and collapse to a single stacked
column below 48rem. Card listings run three-up at ≥1024px, two-up at ≥640px, one-up below, with
images requested at 360px / 45vw / 90vw respectively.

Reading measure is capped at 72ch (`.prose`); a `prose-wide` escape exists for full-width composed
pages. The item detail layout is body plus a persistent sidebar. Header, menu and footer wrap
rather than collapsing into a hamburger, so nothing is hidden behind an affordance on a phone.

**The Phone-First Rhythm Rule.** The donating majority is on a mid-range Android phone. Any layout
whose stacked order buries the price, the seva name or the action below three screens is wrong,
however it reads at 1440px.

## Elevation & Depth

Layered and lifted. Cards sit above the page on a genuinely soft, navy-tinted shadow
(`0 1px 3px rgba(16,24,64,.06)`) and rise on hover (`0 6px 16px rgba(16,24,64,.10)` plus a −2px
translate over 200ms). The shadow is always navy-tinted, never neutral grey — a grey shadow on
cream reads as dirt. Hairline warm borders do the separating work; the shadow supplies the lift.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 3px rgba(16,24,64,.06)`): every card and authored block at rest.
- **Card hover** (`box-shadow: 0 6px 16px rgba(16,24,64,.10)`): paired with `translateY(-2px)`.
- **Float** (`box-shadow: 0 8px 24px rgba(16,24,64,.12)`): elements that genuinely leave the page —
  sticky bars and overlays only.

### Named Rules

**The Border-And-Lift Rule.** A card carries both a 1px warm border and the rest shadow. Neither
alone is the system: the border defines the edge on cream, the shadow says it is a discrete object.

**The Navy Shadow Rule.** Every shadow is `rgba(16,24,64,…)`. Never `rgba(0,0,0,…)`.

## Shapes

Two radii and one pill. Cards, images, note blocks and form fields take 12px (`--radius-md`); the
stat band's outer corners take 16px (`--radius-lg`); every button, chip and icon circle is fully
pilled (999px). Panels that tile edge-to-edge — the stat band's inner cells — take 0 and rely on
1px dividers at 15% white.

Borders are 1px hairlines: warm (`#EAE2D0`) on light surfaces, cool (`#E5E7EB`) on form fields and
tables, `rgba(255,255,255,.15)` on navy. Two accents are 3px left rules in diya gold — the
blockquote and the `:::quote` block. Outline buttons are the one 1.5px stroke in the system.

Photography is always a 16:10 crop with `object-cover` at 12px radius, scaling to 1.03 over 500ms
on hover. The brand icon sits in a 72px cream circle. The section ornament is a centred heading
between two 44px × 1px gold rules.

**The Supplied-Mark Rule.** The Punya mark is used as supplied and never redrawn, recoloured,
outlined or set on a gold field. The wordmark is Playfair navy with `.ngo` in gold, with
*Care · Respect · Nurture* letterspaced beneath at 10px.

## Components

### Buttons
- **Shape:** fully pilled (999px), 44px tall, 24px inline padding, 600 weight at body size.
- **Gold (primary):** diya gold with a **deed-navy-deep label** — the donate action, one per view.
  Hover deepens to `#C4841F`, label unchanged. White on this gold measures 2.5:1 and is never used;
  navy on it measures 6:1, so the accent stays exactly where the system put it and the most
  important control on the site is also its most legible.
- **Navy (secondary):** deed navy on white text, hovering to `#14224E`. Any real action that isn't
  the donation.
- **Outline (tertiary):** 1.5px deed navy stroke on white, navy label; hover fills cream warm. Used
  for "see everything else" links out of a section.
- **States:** all transitions 150ms ease; `:active` scales to 0.98 for a physical press.
- **Focus:** `0 0 0 2px #FFF, 0 0 0 4px #D9952A` — a white gap then a gold ring, so focus is legible
  on white, cream and navy alike.

### Chips
- **Category:** cream warm fill, deed navy label, uppercase 11px at 0.18em, pilled. Neutral
  classification.
- **Most chosen:** gold wash fill, **gold text** label (`#8F5C11`), semibold. The trust's own steer,
  and the only gold mark permitted on a card.

### Cards / Containers
- **Corner:** 12px. **Background:** white. **Border:** 1px warm. **Shadow:** card rest → card hover.
- **Padding:** 24px, with 12px between stacked children.
- **Composition:** 16:10 cover, chips, sans title at 18px, a three-line clamped summary in ink body,
  and — for a seva — the rupee amount as the largest thing after the title, formatted `en-IN` with
  no paise (₹2,100, never ₹2100.00).

### Inputs / Fields
- **Style:** white fill, 1px cool border, 12px radius, 12px padding.
- **Focus:** the gold double ring, same as buttons.
- **Error:** the border becomes danger red (`#C0392B`); the message sits beneath in the same red.
  Red never appears anywhere else.

### Navigation
- **Topbar:** navy ink ground, Devanagari devotional line at left in on-dark-soft, English line at
  right at 12px.
- **Header:** white, 1px warm bottom border, mark at left, menu in navy at 600 weight, one gold
  Donate button pushed right. Wraps on narrow screens rather than collapsing.
- **Footer:** navy ink ground, white headings, on-dark-soft body, 15% white dividers.

### The Stat Band
A run of `:::stat` blocks closes its gutter to zero and reads as one deep-navy band: serif number
in white at 26px, label in on-dark-soft at 14px, 1px white-15% dividers between cells, 16px radius
on the band's outer corners only. On a phone the cells stack and the dividers become top rules. It
is the system's one moment of full-width dark, and it is reserved for real counted numbers.

### The Closing Ask (`:::cta`)
Cream warm rather than navy — an invitation, not a statement. Centred, 64px/32px padding, headline
in Playfair, an 18px line in ink body, one pilled gold action beneath.

## Do's and Don'ts

### Do:
- **Do** keep one gold action per view; demote every competing action to navy or outline.
- **Do** set headings at or below 18px in Source Sans 3 at 600 — the 22px Floor Rule.
- **Do** tint every shadow navy (`rgba(16,24,64,…)`).
- **Do** give cards both a 1px warm border and the rest shadow.
- **Do** format rupees `en-IN` with no fractional digits: ₹2,100.
- **Do** name the seva and its price together; a card without an amount is an unfinished ask.
- **Do** alternate white / cream section grounds on a 96px rhythm.
- **Do** ship real gaushala photography at 16:10 with explicit `sizes`.
- **Do** keep the focus ring gold-on-white-gap, on every focusable element.
- **Do** measure every new text-on-surface pair against 4.5:1 before shipping it.
- **Do** use Ink Quiet (`#616B7A`) for the quietest text and Diya Gold Text (`#8F5C11`) for any
  gold word.

### Don't:
- **Don't** use gradients, blur or glass. Solid surfaces only; the one permitted gradient is a fade
  over a photograph.
- **Don't** set Playfair Display below 22px.
- **Don't** letterspace, shadow or outline Devanagari, or let it carry functional content alone.
- **Don't** introduce red, countdowns, progress bars, donor leaderboards or share counts — the
  confirmed anti-references are guilt fundraising and crowdfunding UI.
- **Don't** add garlands, om/swastik motifs, saffron gradients or animated devotional ornament.
- **Don't** use `#000` for text, borders or panels.
- **Don't** redraw, recolour or reset the supplied Punya mark.
- **Don't** invent a fourth typeface or a second accent colour; two voices and one gold is the
  whole system.
- **Don't** set white text on Diya Gold, or Ink Muted (`#9CA3AF`) as text at any size.
- **Don't** state a number, badge or claim the CMS did not return.
