# Decisions and future online play

## Decision log

| Decision | Reason |
|---|---|
| Working name Peek | Short and friendly; logo expresses two players and a hidden answer. Naming availability has not been researched. |
| Two humans, one device | Concrete offline interpretation without networking or hardware setup. |
| Integer range 0–100 inclusive | Matches the user's described range. |
| Automatic hints | Prevents accidental wrong feedback and keeps the interaction quick. |
| First correct guess wins immediately | Matches the user's race-to-win description. |
| Alternate starter on rematch | Reduces repeated first-seat advantage; does not claim each round is mathematically fair. |
| In-memory session only | Small implementation and fewer chances to expose saved secrets. |
| Mobile-first static PWA | Allows an offline-capable prototype without native packaging or a server. |
| Minimal paper/green visual system | Reflects the user's request for professional minimalism with a cute logo. |
| Focused six-document pack | Backend/API/auth/legal paperwork is unnecessary for this offline kickoff. |
| No research, gates, or audit report | The current user request overrides the workflow in the reference kickoff document. |

## Preserve these boundaries now

Keep comparison logic and transitions in the pure game module. Keep rendering separate from commands. Identify players by stable seat IDs rather than names. Do not encode the shared-device handoff inside mathematical hint computation. This supports reusing rules later; it does not make online play a trivial switch.

## Intended first online mode

Two friends on separate devices join a private room with an invitation code. Each submits a secret privately, sees readiness rather than the opponent's number, then alternates guesses. Preserve the same range, hints, and immediate-win rule. A rematch requires both players to agree and alternates the starter. No public matchmaking or chat initially.

The online build needs a server-authoritative match engine. Server retains both secrets and returns only a player-specific view: phase, permitted action, own guess history/range, opponent readiness, and results when complete. Never transmit the opposing secret before the result. The offline full-state object must **not** be synchronized to clients.

Each guess command needs a match ID, player session identity, request ID for deduplication, and expected turn version. The server validates turn ownership and input and commits the result atomically. It rejects stale/duplicate actions predictably. Reconnection must return the authorized current state instead of replaying UI assumptions.

Future online planning must decide room expiration, private player-session recovery, disconnect grace period, abandoned-match outcome, rate limits, transport, server storage, and deployment. Define online schema and endpoint contracts then. No provider or protocol is locked by these offline docs. Shared-device privacy screens are replaced by remote wait states; the visual system and game rules remain reusable.

## Shipped multiplayer fixes (September 2026)

The shipped implementation uses the host browser as authority, rather than a dedicated server. PeerJS bundled STUN/TURN settings are preserved; a STUN-only override had removed relay support. Initial connection and welcome have a 25-second deadline, cancellation, and stale callback guards. Pending guest connections reserve the second seat and expire if no hello arrives. Closing a room invalidates its callbacks before transport cleanup.

Invite links open name entry directly. Both seats choose a name before play. Online seat views include opponentSecretLocked and opponentGuesses (submitted values and hints only). These fields live in memory and are sent over the encrypted data channel; they are not persisted or logged. Secret values and drafts remain private. Opponent guesses are shown during turns and feedback; local opponent histories remain hidden. Local play must acknowledge its handoff before the next guess.

### Superseding relay decision
Use Cloudflare Realtime TURN and a private credential Worker. Remove static VITE_TURN_SERVERS from the browser build. VITE_RELAY_URL is the only public relay setting. Credential issuance occurs before peer creation, with abort guards for cancelled sessions. Account creation and deployment are pending. See docs/07-relay-setup.md for the exact activation steps and limitations.
