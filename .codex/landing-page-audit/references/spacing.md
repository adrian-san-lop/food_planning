# Spacing & layout

Does spacing group things correctly and give the page room to breathe?

## Spacing scale
- **Gaps and padding come from a fixed scale** (e.g. 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128). Check the code for one-off values like 13px, 22px, 37px. *Why: random values produce near-equal gaps that look accidental.*
- **Steps get further apart as they get bigger.** 12 vs 16 reads as different, 88 vs 96 doesn't. Section padding should jump in clear steps (e.g. 64 → 96 → 128).

## Grouping (proximity)
- **Space between groups is clearly larger than space within them.** Check every heading: the gap above it (to the previous block) should be larger than the gap below it (to its own content). Equal gaps above and below make the heading float between sections. *Why: people read things that are closer together as belonging together (Gestalt proximity).*
- **Common failures on landing pages:**
  - Feature cards: icon, title and text spaced as far apart as the cards themselves.
  - Pricing: the feature list hugs the next plan's card as closely as its own.
  - FAQ: question-to-answer gap equals answer-to-next-question gap.
  - Footer: column headings sit equally far from their links and from the column above.
- **Sections are separated by much more than elements inside them.** Section padding of 96–128px on desktop with in-section gaps of 16–48px is typical; 40px between sections and 40px between cards blurs the page into one block.

## Whitespace
- **Err on the generous side for marketing pages.** Cramped heroes and feature sections read as cheap. Remove space only when a section clearly feels disconnected. *Why: empty space is what makes the important parts stand out.*
- **Space is distributed, not dumped.** A hero with 200px above the headline and 24px between the CTA and the product shot is unbalanced.

## Content width
- **Each block gets the width its content needs, not the container's full width.** Text blocks around 60–70ch, a centered section intro around 600–720px, product screenshots wider. Stretching a two-sentence intro across 1200px is a common failure.
- **When a narrow block looks lost in a wide section, add a column** (text beside an image or a stat) rather than stretching the text.
- **Elements shrink only when the viewport forces them to**: use `max-width`, not fixed percentages, for cards and text.

## Responsive sizing
- **Big things shrink faster than small things.** A 64px desktop headline might drop to 36px on mobile while body copy stays 16px. Scaling everything by the same factor leaves mobile headlines huge or body text tiny.
- **Padding doesn't scale proportionally with font size.** Large buttons get relatively more padding than small ones; section padding on mobile is roughly half of desktop, not the same.