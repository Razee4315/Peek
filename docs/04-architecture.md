# Technical architecture

## Platform and dependencies

Build a mobile-first TypeScript web app using React, Vite, plain CSS, and a PWA service worker through vite-plugin-pwa. React suits explicit screen state; Vite provides a small static build without server rendering; CSS variables implement the supplied tokens. Use Vitest for pure game logic and Playwright for the critical shared-device journey. This document specifies tooling choices, not verified version numbers: select mutually compatible stable versions at implementation time, then pin them in the lockfile. No dependencies are installed in this kickoff.

No backend, database, authentication, API endpoints, file uploads, environment secrets, third-party runtime integrations, or remote fonts in v1. Native mobile was deferred because the initial interaction needs only forms, local state, and offline assets. No SEO or server rendering requirement warrants a full-stack framework.

## Structure and conventions

```text
src/
  app/             # view coordination and lifecycle privacy cover
  game/            # types, reducer, selectors, input validation
  components/      # buttons, number field, handoff, mascot
  screens/         # home, secret, guess, feedback, result
  styles/          # tokens.css and application styles
public/brand/      # copies of supplied SVG assets
tests/             # reducer tests and browser flows
```

Use strict TypeScript, PascalCase components, camelCase functions, and discriminated unions. A pure reducer owns all game transitions; UI components dispatch commands and never write game state directly. CSS values reference tokens; avoid a component library. Use ESLint and Prettier when implementation begins. Commit prefixes: docs, feat, fix, test, chore.

## State contract

`PlayerId = 'p1' | 'p2'`. A session contains `players` (id and displayName), `scores` (integer per seat), and `roundNumber` (starts at 1). A round contains `startingPlayer`, `activePlayer`, `secrets` (nullable integer per seat during setup), `guesses` (ordered attempts per seat), and phase. Each attempt is `{ value: number, hint: 'higher' | 'lower' | 'correct' }`. No timestamps or IDs beyond player seats are needed offline. Derive possible bounds and attempt counts from guesses instead of duplicating them.

Phases: `home`, `handoff`, `secretEntry`, `guessEntry`, `feedback`, `result`. Handoff includes `recipient` and `destination` (`secretEntry` or `guessEntry`). Feedback retains the guesser as active player and their last hint. Result includes `winner`; only entering this phase increments the winner's score. A transient privacy cover remembers the covered phase but is not a turn transition.

Commands: `START_SESSION(names)`, `ACK_HANDOFF`, `LOCK_SECRET(value)`, `SUBMIT_GUESS(value)`, `PASS_DEVICE`, `REMATCH`, `QUIT_SESSION`. Reject commands invalid for the phase without mutation. Two rapid submissions must produce one guess, not two. Disable the submitted form immediately; reducer phase guards are the final protection.

`SUBMIT_GUESS` compares against `secrets[other(activePlayer)]`. Wrong result appends the attempt and enters feedback. Correct result appends the attempt, records winner, adds one point, and enters result atomically. `PASS_DEVICE` switches active player and opens handoff. `REMATCH` clears secrets/guesses/winner, increments roundNumber, toggles startingPlayer, and opens Player 1's setup handoff.

## Persistence and privacy

All game data, including display names, scores, secrets, and guesses, lives **only in memory**, is not encrypted, is never logged, and is cleared by reload/tab close or New game. Names may be personal data; secrets/history are private game data. There is no session storage, local storage, IndexedDB, URL-state encoding, crash payload, or analytics event containing game data. Cache Storage holds only static app assets, with no personal fields; old asset caches are removed when a new version activates.

Reload displays Home with a general note: “Rounds stay on this device until you close or reload.” Do not imply recovery. A backgrounded but living tab retains the round under an opaque cover. Use visibilitychange plus page lifecycle handling for returning from browser history cache; a synchronous focus-loss cover should mask secret entry too. Operating-system app-switcher screenshots cannot be guaranteed private by a web app.

## Offline delivery

Precache the HTML entry, built scripts/styles, icons, and local SVG assets. First access needs a connection (or a locally served installed build); offline support begins only when precaching completes and the app is controlled. Do not claim a downloaded source folder is an installed offline app. Show readiness from actual registration/cache state. Serve production over HTTPS; local development uses localhost. Static hosting can be selected when implementation is ready; no hosting work now.

No remote runtime fetches. Defer a waiting service-worker update while a session is active; on Home or Results offer “Update app”, explaining that it resets the local session. Do not reload automatically in the middle of a round. Cache deletion may remove offline availability; the next online visit restores it.

## Quality targets for implementation

No network-dependent game action. Target an initial JS payload below 150 KB gzip, excluding tooling; measure later. Support current desktop and mobile browsers, 320 px layouts, keyboard-only interaction, screen-reader labels, and reduced motion. These are implementation targets, not verification claims. Render names as text, never HTML. Route all numeric inputs through one shared validator.
