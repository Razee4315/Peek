# Relay setup for Peek

## Selected setup

Use Cloudflare Realtime TURN plus a Cloudflare Worker. Keep the game on GitHub Pages.
The Worker holds the TURN API token privately and issues a fresh two-hour browser
credential when a player creates or joins a room. No provider key is compiled into
Peek. No database, game account, or Metered account is needed.

**Status:** code is prepared; the Worker is not deployed or connected to an account.
Cross-network play is not verified until account setup and the live relay test below.

## One-time setup

1. Create or sign into https://dash.cloudflare.com/ . In Realtime, open TURN and
   create a TURN key. Keep the key ID and API token for the next step. Review any
   billing terms in your account before enabling paid usage.
2. From the Peek repository run these commands, entering secret values only into
   Wrangler's interactive prompts, never into source or the public frontend:

   ```powershell
   npx wrangler@4 login
   npx wrangler@4 secret put TURN_KEY_ID --config relay/wrangler.jsonc
   npx wrangler@4 secret put TURN_API_TOKEN --config relay/wrangler.jsonc
   npx wrangler@4 deploy --config relay/wrangler.jsonc
   ```

   The repository contains the Worker code, allowed origin, and rate-limit bindings.
   The deploy output provides a `https://peek-relay.<account-subdomain>.workers.dev` URL.
3. GitHub repository Settings, Secrets and variables, Actions, Variables: add
   **VITE_RELAY_URL** with the public URL plus `/credentials`. Remove the previous
   `VITE_TURN_SERVERS` repository secret if you added it; it is no longer used.
4. Run Deploy to GitHub Pages again from Actions. Refresh both devices, create a
   new room, and test mobile data against Wi-Fi.

For local frontend development use `.env.local` with VITE_RELAY_URL. A local Worker
must allow the local frontend origin rather than the production origin. Do not
weaken the deployed allowed origin for local testing. Ignore `.dev.vars` files.

## Behavior and limits

The frontend fetches credentials before opening a PeerJS connection and cancels
that fetch if the user leaves. Fetching is bounded to eight seconds; peer connection
has a further 25-second timeout. No secrets are cached in local storage. The Worker
returns no-store responses and never logs provider tokens or generated credentials.

Credentials last two hours from room creation/join. Create a new room for longer
sessions; automatic in-session credential renewal is not implemented. Browser
clients necessarily receive temporary TURN usernames/passwords, but not the
long-lived provider token. Temporary credentials can be copied until expiry.

The endpoint allows the game's origin and uses per-IP (20/minute) and aggregate
(120/minute) edge rate limits. These are best-effort abuse controls, not identity
authentication or a globally strict billing cap. Shared networks may share an IP
limit. Configure provider usage alerts and review usage before broad promotion.
Origin checks alone do not block a non-browser client that spoofs Origin.

The Worker receives a network IP for request limiting, but no player names, guesses,
room codes, or secret game numbers. Cloudflare may process request metadata under
its service terms. Game traffic remains WebRTC encrypted between the players.

## Live acceptance check

Confirm successful room join between mobile data and Wi-Fi, then secret setup,
alternating guesses and rematch. Inspect WebRTC diagnostics for a selected relay
candidate, or test with iceTransportPolicy: relay in a temporary local debug build.
Mock tests do not establish relay reachability. The Worker deployment must succeed
and VITE_RELAY_URL must be set before the public app can create online rooms.

## Sources

- https://developers.cloudflare.com/realtime/turn/generate-credentials/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://github.com/orgs/peers/discussions/1172
