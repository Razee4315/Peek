# Peek

A tiny guessing duel for two. Pick a secret. Find theirs first.

Two modes, playable **face to face on one device** or **online in a private room**, no account, no server to run:

- **Number duel**, each player picks a whole number from 0–100 and races to find the other's. Every guess comes back *higher* or *lower*, and your possible range narrows with you.
- **Code break**, Each player picks a code of 4 different digits (like `0473`). Every guessed digit is marked **Correct** or **Not correct** for its position. Get all four positions correct to win. No misplaced-digit hints are given.

First correct guess wins the round and a point; the first guesser alternates every round. Online, both players agree to a rematch before the next round starts.

## Play

The app is deployed with GitHub Pages: **https://razee4315.github.io/Peek/**

- **On this device**: two players share one phone or laptop. Opaque handoff covers hide each secret between turns, and the round is covered whenever the tab loses focus.
- **Online**: one player creates a room and shares the 5-character code (or the invite link). The other joins, and play syncs live.

## How online play works

GitHub Pages is static hosting, so the host browser owns the match. PeerJS handles signaling. WebRTC uses explicit STUN settings and provider TURN credentials configured through `VITE_TURN_SERVERS`. The old bundled PeerJS relays were discontinued. Without configured TURN, only direct connections are available. See [relay setup](docs/07-relay-setup.md). The guest receives only a seat-scoped view, never the opponent's secret before the result. Submitted guesses and their hints are shared with both players; unsubmitted drafts remain private. Public relay availability and restrictive firewalls can still affect connections. Connecting now times out after 25 seconds with an actionable error and can be cancelled.

Invite links open directly on Player 2's name/join screen. Both players choose a name before joining or creating a room. Codes must contain all five characters.

Secrets, names and guesses are never stored: there is no backend database, no local persistence, and no game data in URLs (the invite link carries only the room code).

## Development

```bash
npm install
npm run dev       # local dev server
npm test          # Vitest suite for the game engine
npm run build     # type-check + production build (base path /Peek/)
npm run preview   # serve the production build
npm run icons     # regenerate PWA icons from assets/logo.svg
```

Stack: React 18 + TypeScript + Vite, plain CSS from `docs/design-tokens.json`, PWA via `vite-plugin-pwa`, Vitest for the pure game engine, PeerJS for online rooms.

Pushes to `main` run [.github/workflows/deploy.yml](.github/workflows/deploy.yml): tests, build, deploy to GitHub Pages.

## Project layout

```text
src/
  game/      # pure engine: reducer, validators, seat views (framework-free, fully tested)
  net/       # PeerJS host/guest transports + message protocol
  hooks/     # local game, online room lifecycle, offline readiness
  components/# buttons, fields, handoff covers, history, dialogs
  screens/   # home, names, online lobby/room, how-to-play
docs/        # product rules, design system, architecture decisions
assets/      # original brand SVGs (mirrored into public/brand)
```

The game rules live in [docs/01-product-and-rules.md](docs/01-product-and-rules.md); the visual system in [docs/03-design.md](docs/03-design.md).
