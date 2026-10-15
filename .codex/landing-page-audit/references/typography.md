# Typography

Is the text set so it's easy to read and clearly ranked?

## Type scale
- **Font sizes come from a small fixed scale**, roughly 6–9 steps for a landing page (e.g. 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60). Check the CSS or the Tailwind classes: 13px, 15px, 17px and 19px all in use means there's no scale. *Why: close-but-different sizes look like mistakes rather than levels.*
- **Steps widen as sizes grow.** Neighbouring body sizes can be 2px apart; display sizes need 12px or more between steps to read as different levels.
- **Sizes in `px` or `rem`, not nested `em`.** Nested `em` compounds and lands off-scale.

## Fonts
- **One family for text, at most a second for display.** Three or more families on a page usually reads as unplanned. *Why: each family brings its own rhythm and proportions.*
- **Display or condensed faces stay at display sizes.** A tall, tight headline face used for 15px body copy is hard to read.
- **The text face has enough weights** to build hierarchy (at least regular, medium/semibold, bold). A family with only regular and bold forces size to do all the work.

## Line length
- **Body copy runs 45–75 characters per line** (roughly `max-width: 60–70ch`). A feature description that runs the full 1200px container is a common failure. *Why: long lines make it hard to find the start of the next line, and short ones break up phrases.*
- **Headlines in the hero wrap to 2–3 lines on desktop.** One very long single-line headline, or a headline broken into one word per line, both read badly.

## Line height
- **Body text: about 1.5–1.7.** Long lines need the high end.
- **Headlines: about 1.0–1.25.** Large type at body line height (1.5+) looks loose and disconnected. *Why: the gap between lines grows with size, so big type needs a smaller ratio.*
- **Multi-line buttons, badges and labels** get a tighter line height than paragraphs.

## Alignment
- **Long text is left-aligned** (for left-to-right languages). Centered hero headlines and short subtitles are fine; centered paragraphs of 4+ lines, centered feature lists and centered FAQ answers aren't. *Why: every centered line starts somewhere new, so the eye has to search for it.*
- **Mixed sizes on one line share a baseline**, e.g. a price "$29" next to "/month". Vertically centering them leaves the small text floating.
- **Numbers in comparison tables are right-aligned or tabular** (`font-variant-numeric: tabular-nums`) so they line up.

## Letter spacing
- **Large headlines in a text face are tracked slightly tighter** (around -0.01em to -0.03em). Default tracking at 48px+ looks airy.
- **ALL-CAPS labels are tracked wider** (around +0.05em to +0.1em). *Why: capitals are all the same height and blur together at default spacing.*
- **Body text keeps the font's default tracking.**

## Links in body copy
- **Inline links are distinguishable without hover**: color plus underline, or underline alone. Color alone fails for color-blind visitors (WCAG 1.4.1). Footer and nav links can stay plain because their position already says they're links.