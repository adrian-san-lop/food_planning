# Images

Do the visuals prove the product and look sharp?

## Product visuals
- **Show the real product**: UI screenshots, real output, a short demo loop. Generic illustrations (people high-fiving, abstract blobs) as the main hero visual don't prove anything. *Why: visitors want to see what they'd get.*
- **Screenshots are readable at their displayed size.** A full 1440px dashboard squeezed into a 600px slot turns 14px UI text into an unreadable 6px smear. Fix: crop to the part that matters, capture at a narrower viewport, or redraw a simplified version.
- **Screenshots sit in a frame that fits the page**: consistent radius, a subtle border or shadow, a browser or device chrome only if it's used consistently.
- **Images are sharp on retina screens** (served at 2× their displayed size, or as SVG) and not stretched. Check for `object-fit` misuse and blurry upscaled assets.

## Photos
- **Photos are high quality and consistent** in color grade and crop. Mixed stock styles (one moody, one bright, one cut-out) look stitched together.
- **People photos in testimonials are real faces at a consistent crop** (same shape, same size, faces centered). Initials-in-circles are fine; stock models posing as customers aren't.

## Text over images
- **Text on a photo or busy gradient is readable everywhere it sits.** Check its lightest/darkest point against WCAG contrast (see color.md). Fixes, from simplest:
  1. A dark (or light) overlay or gradient scrim behind the text area.
  2. Reduce the image's contrast or brightness.
  3. Duotone or tint the image toward the brand color.
  4. A soft, large-radius text shadow with no offset, for small amounts of text.
- **Don't put body paragraphs over photos.** A headline and a button, at most.

## Icons
- **Icons come from one set** with one stroke width and style (outline vs. solid). Mixing sets is visible immediately.
- **Icons are used near their drawn size.** A 16–24px icon blown up to 64px as a feature illustration looks crude. Put the small icon in a tinted shape instead, or use an icon drawn for that size.

## Logos
- **Customer logo rows are optically balanced**: similar visual weight, not identical widths. A wide wordmark and a square mark at the same width look mismatched.
- **Logos in proof rows share one treatment** (all greyscale or all one tone) so none shouts. Full-color logos next to monochrome ones look like a mistake.
- **The product's own logo is crisp at every size**: SVG in the header and a simplified mark for the favicon. Not a downscaled wordmark.