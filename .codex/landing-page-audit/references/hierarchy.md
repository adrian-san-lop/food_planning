# Hierarchy

Can a visitor tell, in a second, what to read first and what to click?

## One focal point per view
- **Each screen-height of the page has one thing that wins.** In the hero that's the headline, then the primary CTA. Check: blur your eyes (or shrink the screenshot to thumbnail size). If two or three things are equally loud, there's no focal point. *Why: the eye picks the loudest thing; when several tie, nothing gets read first.*
- **Fix by quieting the rest, not by making the winner louder.** A hero where the headline, a gradient badge and a stats strip all fight is fixed by toning down the badge and the stats, not by making the headline 96px. *Why: escalating sizes and colors makes the whole page louder and the problem comes back.*

## Emphasis comes from more than size
- **Hierarchy uses weight and tone as well as size.** A pricing card can make the price dominant with weight and dark text at a modest size; the plan description sits back with a lighter tone. Flag pages where the only lever is font size (huge headings, tiny grey body). *Why: size-only hierarchy forces extremes. Headlines get oversized and secondary text becomes too small to read.*
- **Body text tones: about three.** Strong (headings, key values), default (body), muted (meta, captions). More than four distinct text greys on one page usually means nobody chose them. *Why: each extra tone is a level the visitor has to decode.*
- **UI weights: two or three.** Regular for reading, semibold/bold for emphasis, optionally one display weight for headlines. Hairline weights (100–300) for body or small text fail on most screens. *Why: thin strokes break up at small sizes and on low-DPI displays.*

## Muted text on colored backgrounds
- **On a colored section (brand-blue CTA band, dark footer), muted text is a lighter or darker tint of that section's hue, not neutral grey.** Grey on blue reads dirty, and white at 60% opacity looks disabled and shifts over gradients or images. *Why: the goal is lower contrast in the same color family, not a grey cast.*

## Button tiers
- **Primary:** one solid, high-contrast button per view for the main action (start trial, get started, buy).
- **Secondary:** outline, ghost or soft-tint button (book a demo, see pricing). Clearly visible, clearly quieter.
- **Tertiary:** text links (learn more, view docs).
- Flag: two solid buttons side by side in the same color; a secondary action styled louder than the primary; a "Contact sales" link that's more visible than the trial button. *Why: when two actions look equal, the visitor has to stop and choose.*

## Headings: semantic level vs. visual size
- **Small eyebrow labels above section headings** ("PRICING", "FEATURES") should be visibly smaller and quieter than the heading they introduce. Flag eyebrows in the same color and weight as the heading. *Why: the eyebrow is a label; it shouldn't compete with the message.*
- **HTML level doesn't dictate size.** A section's `h2` can be small if the content is the point (e.g. a logo row titled "Trusted by"). Judge the rendered size, not the tag.

## Icons and decoration next to text
- **Icons beside text are toned down**: muted color or a soft tinted background. Solid, saturated icons at text height pull focus from the words they label. *Why: icons are denser than text at the same size, so they look heavier.*
- **Value plus unit reads better than label plus value** in stat strips: "2,400 teams" beats "Teams: 2,400". *Why: the number is what people scan for, and a separate label adds noise.*