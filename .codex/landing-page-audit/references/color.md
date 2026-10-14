# Color

Is color used on purpose, and can everything be read?

## Palette size
- **A page needs more shades than its brand colors.** Expect a neutral ramp (8–11 steps from near-white to near-black), the brand color with lighter and darker steps, and a few semantic accents (success, warning, error). A palette of "brand blue + #333 + #666 + white" forces one-off values everywhere. *Why: tinted backgrounds, borders, hover states and muted text each need their own step.*
- **Shades come from a defined ramp** (CSS variables, Tailwind scale, OKLCH steps), not from `opacity`, `lighten()`/`darken()` or ad hoc hex values. Check the code: a dozen near-identical blues means there's no ramp. *Why: generated in-betweens drift, and nothing looks quite like the brand.*
- **Very light and very dark shades keep some saturation.** A brand tint built by just raising lightness looks greyed out; light tints and deep shades need a touch more chroma than the base. OKLCH makes this easier because lightness is perceptually even.

## Neutrals
- **Avoid pure `#000` text on pure `#fff`** across large areas. A near-black and an off-white are easier on the eye. *Why: maximum contrast causes glare on bright screens.*
- **Neutrals can lean warm or cool** (a slight tint toward the brand hue) to tie the page together. Mixing warm and cool greys on one page looks off.

## Contrast (WCAG 2.2)
- **Body text ≥ 4.5:1, large text (≥ 24px, or ≥ 18.66px bold) ≥ 3:1, UI boundaries and icons that carry meaning ≥ 3:1.** Check the muted grey (it often lands around 3:1), placeholder text, text on brand-colored buttons, and text on gradient or image backgrounds at their lightest point. *Why: low-contrast text is the most common readability failure, and it hits mobile in sunlight first.*
- **If white text on the brand color fails, flip it**: dark text on a light tint of the brand color, or a deeper shade of the brand for the button. Don't just push the brand color darker until it looks muddy.
- **Color is never the only signal.** "Included vs. not included" in a pricing table needs a check/cross icon, not just green vs. grey text (WCAG 1.4.1).

## Color on color
- **Text and icons on a colored section use tints and shades of that section's hue.** A brand-purple CTA band gets white headline text and a light-purple subtitle, not grey.
- **Gradients stay within a close hue range** (neighbours on the color wheel) unless the clash is the brand. Wide-hue gradients behind text make contrast impossible to guarantee.

## Accents
- **The brand color is used sparingly enough to mean something.** If headings, icons, borders, backgrounds and buttons are all the brand color, the CTA stops standing out. Check: is the primary button the most saturated thing on the screen? *Why: color guides the eye only when it's scarce.*
- **Semantic colors keep their meaning**: red for errors and destructive actions, green for success and "included". A red "Start free" button or green error text sends the wrong signal.
- **Cards and panels don't share the CTA's background color.** A button on a same-colored card disappears.