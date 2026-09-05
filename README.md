# Peek

A tiny guessing duel for two. Pick a secret. Find theirs first.

Two modes, playable **face to face on one device** or **online in a private room** — no account, no server to run:

- **Number duel** — each player picks a whole number from 0–100 and races to find the other's. Every guess comes back *higher* or *lower*, and your possible range narrows with you.
- **Code break** — classic Bulls & Cows. Each player picks a code of 4 different digits (like `0473`). Every guess reports how many digits are *exact* (right digit, right spot) and how many are *close* (right digit, wrong spot). Four exact cracks the code.

First correct guess wins the round and a point; the first guesser alternates every round. Online, both players agree to a rematch before the next round starts.

## Play

The app is deployed with GitHub Pages: **https://razee4315.github.io/Peek/**

- **On this device**: two players share one phone or laptop. Opaque handoff covers hide each secret between turns, and the round is covered whenever the tab loses focus.
- **Online**: one player creates a room and shares the 5-character code (or the invite link). The other joins, and play syncs live.

## How online play works

GitHub Pages is static hosting, so there is no game server. Rooms are **peer-to-peer WebRTC data channels** via [PeerJS](https://peerjs.com): its free public broker is used only for the initial handshake. The host's browser is the authority for the match — the guest never receives the opponent's secret, only a seat-scoped view of the game, and secrets live in memory only. In practice this means both players just need a normal browser on HTTPS; there is nothing to install and nothing to pay for. Very restrictive corporate NATs can block direct peer connections — that is a WebRTC limitation, not a bug in the room.

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
