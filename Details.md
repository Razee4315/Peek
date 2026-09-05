# Peek implementation guide

Read README.md and docs/01-product-and-rules.md through docs/06-decisions-and-online.md before building. This kickoff contains documentation and SVG brand assets only. Implementation is deferred until requested.

**Status update (implementation):** the app has now been implemented per the user's follow-up request, React + TypeScript + Vite, plain CSS from the design tokens, Vitest-covered game engine, PWA shell, and online rooms via PeerJS WebRTC (host-authoritative, seat-scoped views) plus a second game mode, 4-digit Bulls & Cows. It deploys to GitHub Pages on push to main. See README.md.

## Hard rules

1. Offline v1 is two humans sharing one device. No backend or online UI.
2. Numbers are integers 0–100 inclusive; validate zero correctly.
3. Compare each guess against the opponent's secret. Automatic hints only.
4. First correct guess wins immediately; alternate starting seat on rematch.
5. Use explicit opaque handoffs. Never expose earlier private content beneath them.
6. Game state stays in memory. Never log, persist, or put secrets/names/guesses in URLs.
7. Keep logic in a pure typed reducer, guarded by phase; UI dispatches commands.
8. Follow docs/design-tokens.json and docs/03-design.md. Use supplied SVGs and local system fonts.
9. Update docs when changing rules or data fields. Online work needs a separate server-authoritative design.
10. During implementation run the focused checks in docs/05-implementation-plan.md before declaring the app complete. Do not claim tests ran during this docs-only kickoff.

Planned stack: React + TypeScript + Vite, plain CSS, vite-plugin-pwa; Vitest and Playwright for implementation checks. Pin compatible versions when scaffolding. No exact versions have been researched or installed here.
