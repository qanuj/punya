# tintorch-cms-site

A starter site for [TinTorch CMS](https://cms.tintorch.com). Point it at a workspace and it
serves everything that workspace publishes.

Black on white, compact, and deliberately plain — a starting point to build on, not a design to
undo.

## Use it

1. **Use this template** on GitHub to create your repo.
2. Install and configure:

```bash
npm install
cp .env.example .env.local
```

3. Put your CMS URL and a delivery key in `.env.local` (CMS → Settings → API keys), then:

```bash
npm run dev
```

That's it. There is nothing to wire up per content type.

## How it works

**There are no per-page files.** One optional catch-all route, `src/app/[[...slug]]/page.tsx`,
serves the whole site.

The CMS tells it what exists. `GET /api/v1/content/site` returns every content type and the path
it publishes under, so URLs resolve against the CMS rather than against anything in this repo:

| URL | What it serves |
|---|---|
| `/` | the item chosen as the home page (Settings → Site) |
| `/blog` | every Blog Post |
| `/blog/some-post` | one Blog Post |
| `/some-page` | one item of the type that owns the root |

**Add a content type in the CMS and this site gains a section** — no route file, no deploy.
Change where a type lives and its URLs follow.

## What comes from the CMS

Everything. The site name, tagline, menu, contact details, social links, page copy, FAQs and
images are all workspace settings or content. This repo holds layout and nothing else.

That is the rule worth keeping if you fork it: if you find yourself hardcoding a phone number, a
headline or a list of links, it belongs in the CMS.

## Content blocks

Authors write `:::card`, `:::stat`, `:::quote` and so on inside a Markdown body. Every fence
renders as a bordered section, sized in twelfths on a wide screen (`:::card 4` is a third of a
row) and stacked on a phone.

**An unrecognised fence degrades to a plain section rather than leaking as text.** A template
cannot know which blocks a workspace will invent, so it does not need to.

`:::faq` and `:::form` are handled separately — FAQs render as their own section from the parsed
`faqs`, and forms need fields this renderer does not fetch.

## Layout

```
src/app/[[...slug]]/page.tsx   every page
src/app/layout.tsx             shell, metadata from the CMS
src/app/globals.css            the theme
src/app/sitemap.ts             built from the same routing as the router
src/lib/cms.ts                 the delivery client
src/lib/routing.ts             URL to content type and slug
src/lib/markdown.ts            Markdown and `:::` blocks
src/components/site-chrome.tsx header and footer
```

## Theme

One ink colour, one paper colour, one grey, hairline rules and a small type scale. Dark mode
follows the system. There is no accent colour on purpose — a starter that picks one is a starter
every site then has to undo.

Edit `src/app/globals.css`; the custom properties at the top are the whole palette.

## Deploying

Any host that runs Next.js. Set `TINTORCH_CMS_URL`, `TINTORCH_CMS_KEY` and `NEXT_PUBLIC_SITE_URL`
in the environment. Pages revalidate every five minutes; the CMS can also purge on publish using
the `cms` and `cms:<type>` cache tags.
