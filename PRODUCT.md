# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: devotional donors in India — Hindu households giving gau seva and daan, often on a phone,
in small one-time or recurring amounts, frequently tied to an occasion (festival, punya tithi,
birthday, a vow). They arrive wanting to *do* a seva, not to study an organisation.

Second, real and not to be broken for: NRI / diaspora donors sponsoring seva remotely. They cannot
visit, pay from abroad, and need proof the seva actually happened.

India leads every design trade-off; diaspora needs must still work.

## Product Purpose

Punya.ngo lets a person perform a named gau seva online and know it was carried out. The site
carries the trust's own words, its work, its proof, and the path from "I want to help" to a
completed seva. Success is a completed seva by a donor who understood exactly what they paid for.

## Positioning

**Traditional sevas, named and bookable — not an open donation box.** Chara, gud, treatment,
annadan and the rest are listed as distinct sevas with their own price, frequency and description,
so the donor chooses an act, not an amount. Contributions are recorded in the Punya app with
photos and updates from the gaushala, which is how the named seva stays verifiable rather than
being a label on a payment form.

## Operating Context

- Content and structure live entirely in TinTorch CMS (`cms.tintorch.com`); this repo holds layout
  and nothing else. Site name, tagline, menu, contact details, social links, page copy, FAQs and
  images are all CMS-side.
- One catch-all route serves every page; sections appear because a content type exists in the CMS,
  not because a file was added.
- Content types in use: Seva (`product`, path `/donate`-adjacent), Blog, Gaushalas, plus Pages
  (About, Our Work, Transparency, Contact).
- Authors write Markdown with `:::card`, `:::stat`, `:::quote` fences; an unrecognised fence must
  degrade to a plain section, never leak as text.
- Donors sign in through TinTorch Account (OIDC) for their account page.
- The Punya app is the companion surface where a donor sees their recorded seva; the site hands off
  to it rather than duplicating it.

## Capabilities and Constraints

- Next.js 16 / React 19, Tailwind v4, server-rendered; pages revalidate every five minutes and the
  CMS can purge by `cms` / `cms:<type>` tags.
- Nothing user-facing may be hardcoded — a phone number, headline or link belongs in the CMS.
- Seva items carry `price`, `currency`, `frequency`, `category`, `popular`, `tags`; `popular` items
  lead a listing.
- Forms are CMS-defined; FAQ and form fences are handled outside the generic block renderer.
- Bilingual by design in a specific way: Devanagari carries devotional accent lines
  (गौ सेवा · गौ संरक्षण · गौ संवर्धन); English always carries the functional content beside it.
  Never make Devanagari the only route to a function.
- Undecided: whether the site itself should ever offer a full Hindi UI, and whether recurring seva
  is managed on the site or only in the app.

## Brand Commitments

- Name and wordmark: **Punya** in navy, **.ngo** in gold. The supplied mark is never redrawn.
- Brand line: *Care · Respect · Nurture*. Devotional line: *Serving Cows, Serving Dharma*.
- Palette is fixed in `src/styles/colors.css`: navy (primary), gold (accent), cream surfaces, one
  ink family. Navy topbar and footer, white header, gold single call to action.
- Typography: Playfair Display (serif headings), Source Sans 3 (body), Tiro Devanagari Hindi
  (Devanagari), declared in `src/styles/typography.css`.
- Tone is devotional and plain-spoken. Seva language ("Ways to serve", "seva", "gaushala") is the
  product's own vocabulary, not decoration — keep it.
- One gold "Donate Now" action in the header; gold is the action colour and is not spent elsewhere.

## Evidence on Hand

Real and usable — design must source these, never invent substitutes:

- Trust registration and 80G numbers.
- Audited accounts / utilisation reports backing the `/transparency` page.
- Ongoing genuine photography of the cows, staff and facilities, delivered via the CMS and the app.
- Live counts: cows under care, sevas completed, gaushalas served.
- Local assets: `public/brand/logo-icon.png`, `logo-mono.png`, `favicon-512.png`,
  `cows.png`, `home-banner.png`, `ourwork.png`, `ourwork-banner.png`.

Absent — must not be fabricated: donor testimonials, press coverage, awards, celebrity or
institutional endorsements, and any statistic not returned by the CMS.

## Product Principles

1. **A seva, not an amount.** Every ask names the act being performed and what it costs.
2. **Proof over promise.** Claims are backed by real photos, real numbers, and documents on the
   transparency page — or they are not made.
3. **The CMS owns the words.** Layout is the repo's job; copy, numbers and links are the trust's.
4. **Phone first, India first.** The donating majority is on a mid-range phone on mobile data.
5. **Devotion carries, English functions.** Sanskrit/Hindi sets the register; English never stops
   working.

## Accessibility & Inclusion

Mid-range Android phones and slow connections are the baseline, not an edge case. Devanagari and
Latin type must both remain legible at body size. Donation and sign-in paths must work without
relying on colour alone, and gold-on-white text must clear contrast at the sizes it is used.
