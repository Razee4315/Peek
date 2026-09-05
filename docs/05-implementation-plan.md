# Implementation plan

**Current phase: documentation complete; application implementation has not started.** The user asked to implement later. This plan defines future checkpoints; no tests or formal verification have been run during this documentation kickoff.

## 1. Playable local loop

Scaffold the chosen toolchain. Implement numeric validation, typed state, reducer, and plain screens. Implement both secret entries, privacy handoff, guesses, hints, winner, session score, and rematch before cosmetic extras.

Done when: two people can complete a full round on one device; each guess targets the opposing secret; only wrong guesses pass the turn; correct guesses award one point; rematch alternates the starting player and collects new secrets.

## 2. Apply the visual system

Map JSON tokens to CSS variables. Add supplied mascot/wordmark, number-entry styling, history rows, focus states, empty/error copy, responsive spacing, and reduced motion. Keep the design light-only for v1.

Done when: every specified screen is styled consistently, no private screen flashes during handoff, controls remain reachable with the virtual keyboard open, and the app remains usable at narrow widths and enlarged text.

## 3. Offline and lifecycle

Add app manifest, install icons generated from the mark, static precaching, offline readiness indicator, safe update prompt, background privacy cover, and intentional reset-on-reload behavior.

Done when: after successful online caching, a new offline launch can play a full session; returning from background hides the game until acknowledged; no game data is persisted; an app update does not interrupt play.

## 4. Focused acceptance checks at implementation time

- Unit: 0 and 100 valid; blank/decimal/signed/exponent inputs rejected; leading zeros normalized; bounds stay inclusive and narrow correctly; equal secrets allowed.
- Reducer: correct opposing target, independent histories, wrong-phase command rejection, duplicate submit protection, correct first guess, single score increment, starter alternation, clean quit.
- Browser: complete two-player journey with wrong and correct guesses; handoff content isolation; rematch; keyboard flow; reload reset; offline cold launch after caching; background cover; update deferred during a round.
- Manually review small-screen layout, screen-reader labels, focus placement, reduced motion, and visible contrast. Automated checks alone cannot confirm the shared-device experience.

Done when these behaviors pass and any differences are reflected in the docs. Do not add account, payment, deployment, analytics, or server work to this phase.

## 5. Online expansion, later

Use the next document as the boundary for a separate implementation effort. Complete and play the offline game first. No online placeholder buttons or unavailable menus in the first release.
