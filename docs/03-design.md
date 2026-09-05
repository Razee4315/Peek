# Visual direction — quiet playfulness

A warm paper canvas, dark ink, a restrained leafy green accent, and a small apricot companion. Professional means orderly spacing, legible type, and obvious controls. Cute comes from the mascot and short copy, not from decorating every component.

This direction is chosen from the user's words “minimalistic”, “professional”, and “cute”. No reference screenshots were supplied; do not invent attributed references.

## Identity

**Peek** is a working name. The mark contains two rounded little characters peeking toward one another: one green, one apricot. Tiny opposing arrows suggest higher/lower without making the identity resemble a calculator. Use [logo.svg](../assets/logo.svg) for the full-color mark, [logo-mono.svg](../assets/logo-mono.svg) for single-color contexts, and [wordmark.svg](../assets/wordmark.svg) for the header. The wordmark's lettering is vector paths, with no font dependency.

Use the full-color mark at 48 px or larger. At 24–32 px use the simplified single-color mark. Minimum clear space is one quarter of the mark height. No stretching, drop shadows, gradients, or placing it over busy photographs. Do not animate the eyes continuously.

## Tokens and type

All values live in [design-tokens.json](design-tokens.json). Use local system sans-serif fonts to avoid network font dependencies. Body 16 px / 1.5; labels 14 px / 1.4; screen title 30 px / 1.15, weight 650; hero numbers 64 px / 1.05, weight 700, tabular numerals. Text ink on paper; muted text uses the muted token, never reduced opacity on whole components. Use white text on the dark-green primary button. Player colors are decorative accents; use ink for their labels.

## Components

- **Page:** paper background, one aligned column, 32–40 px between sections. No dashboard shell or large enclosing card.
- **Primary button:** green, white text, 14 px radius, minimum 52 px tall, 16 px semibold. Hover uses primaryHover; keyboard focus uses a 3 px focus ring with 3 px offset. Press scales to 0.98 unless reduced motion is enabled.
- **Secondary button:** transparent, ink text, visible border, same target height. Only one filled primary action per screen.
- **Number input:** white background, 2 px inputBorder outline, 16 px radius, centred tabular digits; minimum 88 px height. Error copy below, not a toast. Secret inputs use masking, never pale low-contrast digits.
- **History:** flat rows separated by hairlines; value on left, arrow plus word on right. Expand/collapse control uses a text label and expanded state.
- **Feedback:** ink headline, small green up arrow or apricot accent around down arrow. Both use explicit direction text; higher and lower are equally valid outcomes, not success/error colors.
- **Dialogs:** solid surface, clear title and two actions. “Keep playing” is primary on quit confirmation; “End game” is secondary.

## Motion and tone

150 ms opacity/translation transitions, at most 6 px displacement. Privacy screens replace private content immediately with no outgoing fade. Reduced motion removes transforms and celebrations. Friendly short copy: “Your secret”, “Higher”, “Pass to Sam”. Avoid insults, fake urgency, streak pressure, excessive exclamation marks, emojis as control icons, and jokes in errors.

## Avoid

Purple gradients; glass panels; neon glow; decorative charts; piles of rounded cards; giant hero marketing sections inside the game; ornamental backgrounds; remote fonts; color-only player identification. Keep mascot use to Home, handoffs, and Results.
