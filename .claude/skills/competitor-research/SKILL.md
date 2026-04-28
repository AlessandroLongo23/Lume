---
name: competitor-research
description: Use when the user wants to research, profile, or analyze a competitor — especially Italian salon software competitors of Lume. Triggers on phrases like "research competitor X", "analyze [URL]", "profile this rival", "how does X compare to us", "do a competitor analysis", "ricerca concorrente", "analizza concorrente". Fetches the competitor's site, takes UI screenshots, and writes a structured report covering company basics, pricing, target market, tone of voice, branding, features, UVP, and interface.
argument-hint: [competitor-name-or-url]
allowed-tools: WebFetch, WebSearch, Read, Write, Bash(mkdir *), Bash(date *), mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_close, mcp__playwright__browser_resize, mcp__playwright__browser_wait_for
---

# Competitor research

Produce a structured competitor profile for Lume — the Italian salon SaaS at €49/mo monthly · €490/yr, undercutting the €60/mo incumbent with a modern, minimal UX (indigo accent, Geist Sans).

The skill takes a competitor name or URL, fetches public info, captures UI screenshots, and writes a Markdown report.

## Lume positioning constants (use these when comparing)

- **Pricing:** €49/month or €490/year (2 months free).
- **Brand:** Lume = Italian for "light" — clarity, illumination. Cool & crisp. Indigo `#6366F1` accent on zinc/slate. Geist Sans typography.
- **Tone:** Professional, modern, minimal — no luxury salon vibes.
- **Target:** Independent Italian hair and barber salons, small-to-medium (1–5 chairs), currently using outdated tools or paper.
- **Known incumbent:** A €60/mo Italian salon software with poor UX. Feature parity with it is the first milestone.

If these change, update them here and in [CLAUDE.md](../../../CLAUDE.md) "Product" section together.

## Workflow

### 1. Resolve the target

Argument: `$ARGUMENTS` is either a URL or a competitor name.

- If it looks like a URL (starts with `http`, contains `.`), use it directly.
- Otherwise, run a WebSearch for `"<name> gestionale parrucchieri"` or `"<name> salon software italia"` and pick the top official result. If you can't confidently pick one, ask the user to confirm the URL before proceeding.
- Compute a slug from the competitor name: lowercase, hyphenated, ASCII (e.g., "Treatwell Italia" → `treatwell-italia`).
- Compute the report date: `!`date +%Y-%m-%d``.

### 2. Identify category

Classify the competitor as one of:

- **Direct** — salon-management software targeting Italian salons (agenda, fiches, ordini).
- **Indirect** — booking-only tools or general SaaS that overlap (Treatwell, Fresha, Calendly).
- **Substitute** — non-software workflows (Excel, paper agendas, Google Calendar).

Put the category at the top of the report. This is the single most important framing for any later "where Lume wins / loses" judgement.

### 3. Fetch public surfaces

Use **WebFetch** in parallel for these candidate paths (skip 404s silently):

- `/` (homepage)
- `/prezzi`, `/pricing`, `/abbonamenti`
- `/funzionalita`, `/features`, `/funzioni`
- `/chi-siamo`, `/about`, `/azienda`
- `/blog` or `/news` index (just to see frequency / topics, not deep-read)

For each fetch, save short notes — don't paste raw HTML into the report.

If any page is empty or login-walled, write "not publicly accessible" in the relevant section.

### 4. Capture screenshots

Use **Playwright MCP** to capture the competitor's visible UI:

1. `mkdir -p output/marketing/competitor-research/<slug>/screenshots`
2. `browser_resize` to 1440×900 (so screenshots match a typical desktop).
3. `browser_navigate` to the homepage. `browser_wait_for` 1–2 seconds for fonts/images.
4. `browser_take_screenshot` with `fullPage: true`, save as `output/marketing/competitor-research/<slug>/screenshots/homepage.png`.
5. Repeat for the pricing page → `pricing.png`.
6. If there's a public product tour, demo video page, or screenshots gallery, capture one frame as `product-tour.png`.
7. `browser_close` when done.

If Playwright fails on a page (timeout, anti-bot, login wall): note it in the report's section 6 instead of stopping.

### 5. Extract data into the template

Read the fetched HTML/text and screenshots, then fill the report template below. Rules:

- **Never invent.** If founding year, team size, or funding aren't on the site / a quick LinkedIn search, write "not disclosed". This skill prefers absence over hallucination.
- **Quote their words** for UVP and tone-of-voice analysis ("Headline UVP" should be a literal quote, in Italian if the site is Italian).
- **Be concrete on UX** — "dense table with 12 columns above the fold", not "looks dated".
- **Detect the Italian formal register** — does their copy use "Lei" (formal) or "tu" (informal)? It matters for cold-call tone calibration.

### 6. Compare against Lume

End with a "Lume read" section: two short paragraphs.

- **Where Lume wins** — concrete advantages (price, UX, specific feature gaps, modern stack).
- **Where they win** — what to copy or counter. Be honest; no homer bias.

Include a one-line "verdict": Direct threat / Indirect threat / Not a threat / Possible partner.

### 7. Write the report

Path: `output/marketing/competitor-research/<slug>/report.md`.

Template:

```markdown
# Competitor: <name>

**Category:** Direct | Indirect | Substitute
**Verdict:** Direct threat | Indirect threat | Not a threat | Possible partner
**Website:** <url>
**Researched:** YYYY-MM-DD

## 1. Company basics
- **Founded:** <year or "not disclosed">
- **HQ:** <city, country>
- **Team size:** <approx, from LinkedIn / About page>
- **Funding / ownership:** <if public>
- **Notable customers:** <names if shown on site>

## 2. Pricing & business model
- **Plans:** <plan name — €X/mo or €Y/yr — what's included>
- **Free trial:** <yes/no, length>
- **Setup fees / per-seat / hidden tiers:** <yes/no, details>
- **Lume comparison:** Lume is €49/mo · €490/yr. Where do they sit?

## 3. Target market
- **Who they explicitly target:** <salon size, vertical, geography>
- **Languages supported:** <list>

## 4. Tone of voice & branding
- **Colors:** <hex if visible — primary, accent, neutrals>
- **Typography:** <fonts used>
- **Logo style:** <wordmark / icon / both — describe in one phrase>
- **Copy register:** Lei (formal) | tu (informal)
- **Tone:** <e.g., "technical and feature-list-heavy" | "warm and emotional" | "luxury">
- **Brand metaphor / repeated positioning words:** <list 3–5>

## 5. Features & UVP
- **Headline UVP (their words):** "<literal quote>"
- **Top features above the fold:** <bulleted list>
- **Distinctive features Lume doesn't have:** <list, or "none observed">
- **Features Lume has that they don't:** <list, or "n/a">

## 6. Interface
![Homepage](screenshots/homepage.png)
![Pricing page](screenshots/pricing.png)
<add product-tour.png if captured>

**UX notes:**
- Density: <sparse / balanced / cramped>
- Modernness: <2015-era / 2020-era / current>
- Mobile responsiveness: <observed yes/no>
- Distinctive interactions or patterns worth noting: <list>

## 7. Lume read

<2 paragraphs: where Lume wins, where they win.>

**Verdict:** <one line — repeat from header>
```

## Edge cases & guardrails

- **Login wall:** If the product is only accessible after signup, skip section 6's screenshots and write "interface inaccessible without account — only public marketing surfaces analyzed". Do not invent UI details.
- **Italian-first sites:** Prefer Italian source pages (`/prezzi`, `/funzionalita`, `/chi-siamo`) over English equivalents. Write the report in English, but quote their Italian copy verbatim when used as evidence.
- **Branding details from screenshots:** Read hex codes from CSS (you can fetch `style.css` or inspect via Playwright `browser_evaluate` if needed). Don't guess from a small thumbnail.
- **Funding & team data:** Only include if found on About page or the user mentions a known LinkedIn / Crunchbase URL. A quick WebSearch is fine; deep enrichment is not.
- **No data fabrication.** "not disclosed" is always a valid answer.
- **Don't run a full SWOT.** This skill produces a profile, not a full strategic analysis. Section 7 ("Lume read") is the only opinion section.

## What this skill does NOT do

- Generate marketing copy, ads, or campaigns.
- Estimate revenue, ARR, or market share (too much guessing).
- Compare more than one competitor in one run — invoke once per competitor.
- Pull data from paid tools (SimilarWeb, SEMrush) — public web only.

## Output location

```
output/marketing/competitor-research/<slug>/
  report.md
  screenshots/
    homepage.png
    pricing.png
    product-tour.png   (if captured)
```
