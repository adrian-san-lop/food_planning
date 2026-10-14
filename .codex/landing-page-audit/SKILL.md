---
name: landing-page-audit
description: Audits a landing page — a live URL, a screenshot, or the page's code — against a design rule set (hierarchy, typography, color, spacing, surfaces, images, consistency) plus landing-page checks (first screen, CTAs, proof, section rhythm, mobile), and benchmarks its weakest sections against real, category-matched sections from Landingfolio's gallery via the Landingfolio MCP. Returns a severity-grouped report (Critical / Major / Minor) where every finding names the element, the rule, why it matters, and a concrete fix. Use when the user says "audit my landing page", "review this page", "critique my homepage", "what's wrong with this design", "design feedback on <url>", "why doesn't this page convert", or hands over a URL, screenshot or component. Works without the MCP (rules-only audit). NOT for copy rewriting, accessibility compliance, SEO, or code-quality review.
---

# Landing Page Audit

Reviews a landing page the way a senior designer would: looks at it on desktop and on a phone, walks a fixed rule set, compares its weakest sections with how real live pages handle the same section, and returns a short, severity-grouped list of specific fixes.

`<skill-dir>` below means the folder this SKILL.md is in.

## When to use this skill

- "Audit my landing page" / "review https://…" / "critique this homepage"
- "What's wrong with this design?" / "design feedback before launch"
- "Why does this page feel off / amateur / generic?"
- A screenshot, a `.html`/`.vue`/`.jsx`/`.tsx`/`.svelte` file, or a URL plus "thoughts?"

## When NOT to use this skill

- Rewriting the copy → a copy pass (e.g. the `humanize-copy-pass` skill); this audit flags design problems only
- WCAG/accessibility compliance, SEO, page speed, or code quality → not covered
- Designing new sections → `explore-landing-sections`
- Only fixing the mobile layout → `mobile-responsive-pass`

## Connect the Landingfolio MCP

The MCP lets the audit compare the page's weakest sections with real, current sections of the same type from landingfolio.com ("7 of the 8 live pricing sections pulled highlight one plan; yours shows three equal cards"), instead of judging against rules alone. It's free (20 component fetches a day).

**Check first:** look for tools from a server named `landingfolio` — `list_categories`, `get_components`, `get_inspiration_page` (Claude Code shows them as `mcp__landingfolio__*`).

**If they're missing**, run the rules-only audit (skip Step 4) and say so in one line at the top of the report and in your reply. Never block on it:

> Benchmarks skipped: the Landingfolio MCP isn't connected. To compare your sections with real live examples, get a free token at https://www.landingfolio.com/mcp and run:
> `claude mcp add --transport http landingfolio https://mcp.landingfolio.com/mcp --header "Authorization: Bearer <your-token>"`
> (Cursor, Codex, Windsurf, VS Code and others: the same page has the snippet for each.)

## Critical rules

1. **Look at the actual page before opining.** Screenshots at desktop and 390px for a URL; read the file for code. Never critique from an idea of "what a typical landing page looks like".
2. **Every finding cites a rule** from `references/` (name the file). If you can't point to a rule, drop the finding.
3. **Every finding names the element** (section + element, selector, file:line, or visual region) and gives a concrete fix. ❌ "Improve hierarchy." ✅ "Hero: 'Start free' and 'Book a demo' are identical solid purple buttons — keep 'Start free' solid, make 'Book a demo' an outline button."
4. **Keep the reason.** "This violates X *because Y*; try Z" — never just "this is bad".
5. **Benchmarks are evidence, not rules.** A benchmark line strengthens a finding and links the real examples; it never creates a finding on its own ("other pages use dark heroes" is not a problem).
6. **Calibrated severity.** Most pages have 3–8 real problems, not 25. Audit only; don't redesign or edit code unless the user asks after the report.

## Workflow

```
- [ ] Step 1: Identify the artifact and its product category
- [ ] Step 2: Capture and inspect it (desktop + 390px)
- [ ] Step 3: Walk the rule set
- [ ] Step 4: Benchmark the weakest sections (MCP path)
- [ ] Step 5: Calibrate severity
- [ ] Step 6: Write the report
```

### Step 1: Identify the artifact

| Input | How to handle |
|-------|---------------|
| URL (live or `localhost`) | Screenshot it (Step 2) **and** fetch its HTML for exact values |
| Screenshot (`.png`/`.jpg`) | Open it; ask for a mobile screenshot too if only desktop was given (or note mobile wasn't audited) |
| Component/page file (`.html`, `.vue`, `.jsx`, `.tsx`, `.svelte`, `.astro`) | Read it and the styles it uses; if the dev server runs, also screenshot the rendered page |
| Figma link | Ask for an exported PNG — Figma URLs aren't renderable |
| Nothing given | Ask once: "Which URL, file or screenshot should I audit?" |

Note the product's category in a few words (B2B SaaS, dev tool, consumer app, agency, e-commerce, course…). It sets expectations for proof and CTAs.

### Step 2: Capture and inspect

For a URL, take two full-page screenshots — 1280px wide and 390px wide — with whatever the environment has: a screenshot skill such as `screenshot-capture`, a browser MCP, or Playwright (`npx playwright screenshot --full-page --viewport-size=390,844 <url> mobile.png`). Open both.

Before auditing, describe what you see in 2–3 lines (the sections in order, the overall look) so the user can check you're looking at the right thing. Then list the page's sections with their Landingfolio category: `hero`, `logo-cloud`, `feature`, `how-it-works`, `testimonial`, `pricing`, `faq`, `call-to-action`, `footer`, …

From the code/HTML, note the real values: font families, sizes and weights; text colors; spacing values; shadows, radii, borders; button styles.

### Step 3: Walk the rule set

Read each reference and check its rules against the page:

| Dimension | File | Look for |
|-----------|------|----------|
| Landing page | [landing-page.md](references/landing-page.md) | First screen clarity, one primary CTA, proof near decisions, section rhythm, mobile |
| Hierarchy | [hierarchy.md](references/hierarchy.md) | >3 text colors, competing focal points, grey on color, no clear primary action |
| Typography | [typography.md](references/typography.md) | Too many sizes, line length, line height, centered paragraphs |
| Color | [color.md](references/color.md) | Too few shades, contrast failures, overused brand color |
| Spacing | [spacing.md](references/spacing.md) | No scale, ambiguous grouping, full-width text, uniform section gaps |
| Surfaces | [surfaces.md](references/surfaces.md) | Border + shadow + fill overload, inconsistent shadows, uneven cards |
| Images | [images.md](references/images.md) | Unreadable or stretched screenshots, text over busy photos, mixed icon sets |
| Consistency | [consistency.md](references/consistency.md) | One-off values everywhere, mixed radius, missing hover/focus, default bullets |

Be honest: most pages violate a handful of rules meaningfully. Don't fill every bucket.

### Step 4: Benchmark the weakest sections (MCP path)

Pick the **2–3 sections with the most serious findings** (often the hero plus one of pricing, features or testimonials). For each:

1. `list_categories` once, to get exact slugs.
2. `get_components` with that section's category. Download and open 6–8 of the screenshots that fit the product category — never judge from URLs alone:
   ```bash
   mkdir -p .landing-audit/refs && curl -sL "<image-url>" -o .landing-audit/refs/<category>-<n>.jpg
   ```
3. For each finding in that section, check how the references handle the same thing. Write a **Benchmark** line only when they show a clear pattern: "6 of 8 live pricing sections highlight one plan (e.g. <source>, <source>)". Link 1–3 `source` URLs.
4. Also note anything the references consistently do that the page lacks *and* that a rule in `references/` supports (e.g. testimonials with photos → consistency.md, images.md). That can become a finding with the rule cited.

If the user names a site they want to be closer to and it's on Landingfolio, `get_inspiration_page` with its slug returns the full page in tiles — compare section by section.

### Step 5: Calibrate severity

- **Critical** — the page fails its job: you can't tell what the product is from the first screen, the primary CTA is missing or invisible, text is unreadable, the mobile layout is broken (horizontal scroll, clipped content).
- **Major** — visibly wrong and hurts trust: competing CTAs, no proof near the decision, flat uniform sections, weak headline contrast, low-quality or stretched images.
- **Minor** — polish: default bullets, inconsistent radius, a slightly long line length, an off line-height.

If more than two findings are Critical, re-read and demote.

### Step 6: Write the report

Write it to `landing-page-audit.md` in the project root (or where the user asked) and give the path plus the Critical list in your reply. Use this format:

```markdown
# Landing page audit — <page name or URL>

**Looked at:** <what you inspected: URL at 1280 + 390px / file / screenshot>
**Benchmarks:** <"N live <categories> sections from Landingfolio" or "skipped — Landingfolio MCP not connected">

## Critical
### 1. <Short title>
**Where:** <section › element, selector or file:line>
**Violates:** <rule, file in references/>
**Why it matters:** <the rule's reason>
**Benchmark:** <optional — "6 of 8 live hero sections …" + 1–3 source links>
**Fix:** <specific change>

## Major
### 2. …

## Minor
### 3. …

## What's working
- <1–3 things to keep>

## Next step
<one line, e.g. "Want me to apply fixes 1–4?" or "Want 3–4 directions for the hero? (explore-landing-sections)">
```

## Examples

**"Audit https://acme.dev"** → screenshots at 1280 and 390 + HTML → sections: header, hero, logo-cloud, feature ×3, pricing, faq, footer → rules: hero has two identical CTAs (hierarchy), feature cards use 4 greys (color), pricing has three equal cards with no recommended plan (landing-page) → benchmark hero + pricing: `get_components hero`, `get_components pricing`, 8 each viewed → report: 1 Critical, 3 Major, 2 Minor, with benchmark links on the hero and pricing findings.

**"Audit `src/pages/index.astro`", MCP not connected** → read the file and its CSS, screenshot the dev server at both widths → rules-only report with "Benchmarks: skipped" and the connect note.

## Troubleshooting

- **Audit reads generic, could apply to any page:** you skipped Step 2 or padded findings. Re-open the screenshots; every finding needs a named element.
- **Everything is Critical:** severity inflation. Critical = the page can't do its job.
- **A benchmark became the finding** ("other sites use bento grids"): drop it unless a rule in `references/` backs it.
- **The page is JS-rendered and the HTML fetch is empty:** rely on the screenshots and the browser's computed styles.
- **User disagrees with a finding:** the reason is the conversation, not the rule. If their context justifies the choice, drop it.
- **429 from the MCP:** the free tier is 20 component fetches a day; benchmark one section instead of three.

## Reference

The rule set lives in [references/](references/), one file per dimension. See [references/index.md](references/index.md).