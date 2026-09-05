# Working cross-network relay setup

PeerJS discontinued its public TURN service in December 2023:
https://github.com/orgs/peers/discussions/1172
The installed package still contains those old URLs. They are not a usable fallback.

The application now supplies explicit ICE settings. Without configured TURN it
can attempt a direct connection using STUN, but cannot promise cross-network play.

## Required deployment configuration

1. Obtain browser TURN credentials from a provider such as Metered, or an existing
   coturn server. Prefer a configuration that includes TCP/TLS on port 443.
2. In this GitHub repository, open Settings, Secrets and variables, Actions.
   Add a repository secret named `VITE_TURN_SERVERS`. Its value is a JSON array
   of RTCIceServer objects containing `urls`, `username`, and `credential`.
   See `.env.example` for the shape. Use issued TURN credentials, not an API key.
3. Run the Deploy to GitHub Pages workflow again. Vite embeds the configuration
   at build time. Adding the secret alone does not update an existing deployment.
4. Refresh both devices, create a new room, and test mobile data against Wi-Fi.

TURN credentials necessarily reach the browser and are visible in the built app.
The GitHub secret keeps them out of source history, not out of client access.
Use a limited, revocable TURN credential intended for browser use, with provider
usage limits. Do not use an account-management API key. If credentials expire,
rotate and rebuild; short-lived per-session credentials need a backend endpoint.

For local development put the same variable in `.env.local`, which is ignored.
No credentials have been provisioned as part of this code change. Deployment
without that repository secret remains direct-only.

## Verification needed after configuration

Confirm that browser WebRTC diagnostics select a `relay` candidate when a direct
connection is unavailable. Test joining, both secret submissions, alternating
guesses, and rematch from separate networks. Unit tests validate configuration
and transport lifecycle, not provider reachability or a successful relay session.
