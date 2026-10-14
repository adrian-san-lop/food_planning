# Surfaces

Cards, shadows, borders and section backgrounds: do they separate things cleanly without adding noise?

## Separation without clutter
- **Use the lightest tool that separates.** In order: more space → a background change → a soft shadow → a border. A card with a border, a shadow and a different background all at once is usually doing triple work. *Why: every line on the page competes for attention, and borders add the most lines.*
- **Borders, when used, are subtle**: a neutral one or two steps darker than the surface, 1px. Dark grey 1px borders around every card make the page look like a wireframe.
- **Section backgrounds alternate with intent**, e.g. white → subtle neutral tint → white → dark brand band for the final CTA. Flag a page where every section is the same white with the same gap (see landing-page.md, section rhythm), and flag the opposite: five different background colors with no logic.

## Shadows
- **Shadows fall downward** (positive y-offset, light from above) and all shadows on the page agree on direction. Flag shadows offset sideways or upward, and mixes of directions.
- **Shadows come from a small elevation set**, about 3–5 levels, used consistently: resting cards low, hovered cards a step up, popovers and modals highest. Check the code for a different `box-shadow` on every component.
- **Low elevations are tight and close; high elevations are softer and spread further.** A resting card with a 40px-blur shadow looks like it's floating off the page.
- **Shadows are tinted toward the surface or brand hue, or are neutral at low opacity.** Pure black at high opacity looks dirty, especially on colored sections.
- **Shadows on dark backgrounds barely show.** On dark sections, separate cards with a lighter surface or a faint border instead.

## Layering
- **Overlap can add depth on purpose**: a product screenshot hanging over the boundary between the hero and the next section, or a card that breaks out of its band. Check that the overlap looks deliberate (consistent offset, clean edge), not like a layout bug.
- **Lighter surfaces read as closer, darker as further back** (in light themes). A card darker than its section looks sunk in, not raised.

## Cards
- **Cards in one row share padding, radius, elevation and height.** Uneven heights in a feature grid or pricing row look broken. Align their CTAs to the bottom.
- **The recommended pricing plan is lifted by one clear signal** (a border in the brand color, a badge, a tinted background or a higher elevation), not four at once.