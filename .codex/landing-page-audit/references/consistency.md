# Consistency & finish

Does the page look like one system made it, and does it have the small details that make it look finished?

## A system, not one-offs
- **Values come from tokens**: colors, font sizes, spacing, radii, shadows and weights each come from a short defined list (CSS variables, Tailwind theme, design tokens). Check the code. Many arbitrary values (`text-[15px]`, `mt-[22px]`, inline hex colors) mean the page was tuned by eye, section by section. *Why: one-off values pile up into small mismatches that make a page look unfinished.*
- **Same component, same look.** Every primary button has the same height, radius, padding and font across the page. Every card in a grid matches. Check the hero CTA against the pricing and footer CTAs.

## Personality is consistent
- **One radius family.** Sharp (0–4px), soft (6–12px) or round (16px+/pills) can all work; mixing pill buttons, sharp cards and 12px inputs on one page looks like three designs merged.
- **Type, color, radius and copy tone point the same way.** A playful rounded display face with a stern, corporate navy palette and square corners sends mixed signals. Flag the outlier, not the overall style choice.
- **Illustration and icon style is uniform** (all line, all 3D, all flat). One 3D render among flat icons stands out.

## Finishing details
These separate "built" from "designed". They're Minor findings, never Critical.
- **Lists that sell use icons, not default bullets**: checkmarks in pricing features, small topical icons in feature lists.
- **Testimonials are treated as content, not footnotes**: readable size, quote marks or a card, the person's photo, name and role.
- **Interactive elements have hover and focus states**: buttons darken or lift, links change, and keyboard focus is visible (`:focus-visible` ring). A page with no hover feedback feels static.
- **Plain sections get a little interest where it helps**: a subtle background tint, a faint pattern or gradient at low contrast, a single decorative shape. Decoration must stay behind the content; if it competes with text, it's too strong.
- **Accents are used sparingly**: a small brand-colored line under an eyebrow or on the active nav item can tie the page together. On every card it becomes noise.
- **Form fields on the page (newsletter, waitlist) match the buttons**: same height and radius as the button beside them, with a visible focus state.