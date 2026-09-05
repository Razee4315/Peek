# Peek

A tiny guessing duel for two. Pick a secret. Pass the phone. Find theirs first.

This is a **documentation and brand starter**, not an implemented app. The working name is Peek; it can be renamed. No research, competitor analysis, or formal verification report is included, as requested.

## Read in this order

1. [Product and rules](docs/01-product-and-rules.md)
2. [Screens and interaction](docs/02-screens-and-flow.md)
3. [Visual direction](docs/03-design.md)
4. [Technical architecture](docs/04-architecture.md)
5. [Implementation plan](docs/05-implementation-plan.md)
6. [Decisions and future online play](docs/06-decisions-and-online.md)

[Design tokens](docs/design-tokens.json) are the source of visual values. [Logo preview](assets/logo-preview.html) shows the original SVG assets in a browser.

## Scope agreed from the request

- A fun number-guessing game, offline first; online players later.
- Two people pick secret numbers, then alternate guesses with up/down feedback.
- Minimalist and professional presentation, with a cute SVG logo.
- Documentation now; implementation later.

## Defaults chosen to make implementation concrete

- Offline means two humans sharing one device, not an AI opponent or two devices over Bluetooth.
- A mobile-first installable web app is the initial target.
- Both endpoints count: integers **0 through 100**, giving 101 choices.
- The app calculates honest hints; players do not manually judge guesses.
- The first correct guess ends the round immediately. There is no equalizing turn; first player alternates on rematches.
- Secret numbers stay in memory. Reloading ends an unfinished round.

These are documented product decisions, not claims that the user explicitly specified every detail. No application code, backend, dependency installation, or deployment is included.
