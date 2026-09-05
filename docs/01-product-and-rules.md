# Product and rules

## Promise

Peek is a small, face-to-face game for friends: each person chooses a hidden number, then tries to discover the other person's number first. A round should be easy to start and comfortable to play on a shared phone. The interface supplies the hints and remembers earlier guesses.

## First release

Two local human players; optional names; private secret setup; integer guesses from 0–100; automatic higher/lower hints; separate guess histories; a privacy handoff screen between players; immediate winner reveal; local session score; rematch; concise rules; reduced-motion support. All game functions work without network access after the app has been cached successfully.

Not included: online rooms, accounts, bots, chat, timers, difficulty modes, ads, paid features, public leaderboards, cloud saves, analytics, or a backend.

## Exact rules

1. Player 1 and Player 2 enter optional display names. Blank names use these defaults. Duplicate names are allowed; player number always identifies the seat.
2. Player 1 privately chooses an integer from 0 to 100 inclusive and locks it in. Player 2 then privately chooses theirs. Equal secrets are valid.
3. Player 1 guesses first in the first round. Players alternate after every incorrect guess.
4. A player's guess targets **the other player's secret**. Example: Player 2's secret is 76; Player 1 guesses 50; the app says **“Higher — their number is above 50.”**
5. A higher hint means target > guess; a lower hint means target < guess. Bounds exclude the attempted value: after 50 → higher, remaining range starts at 51.
6. Show the current guesser only their own previous attempts and remaining possible range. That range starts at 0–100 for each player independently.
7. A correct guess ends the round immediately. No additional turn or draw. This intentionally favors the starter slightly; alternate the starting seat each round.
8. Incorrect feedback stays visible until the current player taps “Pass to [name].” This opens the opaque handoff screen. The recipient taps “I'm [name] — ready” before seeing their turn.
9. The winner receives one point in this in-memory session. Results reveal both secrets and both attempt counts. Rematch requires both players to choose fresh secrets; either may reuse a previous value.
10. “New game” resets names, score, and starter to Player 1, after confirmation when abandoning an active session. Rematch preserves names and score.

## Input and privacy rules

- Number fields begin blank, accept digits only, and normalize leading zeros: `007` becomes 7. Zero is valid; empty is not.
- Reject decimals, signs, scientific notation, non-digits, and values above 100. Validate typed and pasted input through the same function.
- Reject guesses outside that player's remaining possible range. They do not consume a turn. A prior incorrect guess will necessarily be outside the narrowed range.
- Secret entry is masked by default. A labelled “Show number” toggle reveals it until toggled off, locked, or the app loses focus. Never show a saved secret on later setup or turn screens.
- Shared-device privacy is protection against casual glances, not protection against someone inspecting browser memory or developer tools.
- Leaving an active setup, turn, or feedback screen covers it with a privacy screen. Returning requires an explicit readiness tap; the turn and state are unchanged.

## Success criteria for the later build

Two people can complete setup and a round without instruction from the developer. Correct hints, endpoints, turn ownership, score updates, privacy handoffs, and rematches behave exactly as above. A cached app can play a complete new session in airplane mode. The design works at 320 px wide and with keyboard navigation. No telemetry is needed to assess these during initial playtesting.
