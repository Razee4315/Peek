import { parseTurnServers } from '../../src/net/turnServers'

interface Limiter { limit(input: { key: string }): Promise<{ success: boolean }> }
export interface Env {
  TURN_KEY_ID: string
  TURN_API_TOKEN: string
  ALLOWED_ORIGIN: string
  IP_LIMITER: Limiter
  GLOBAL_LIMITER: Limiter
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Vary': 'Origin' })
    const reply = (status: number, body: unknown) => Response.json(body, { status, headers })
    if (new URL(request.url).pathname !== '/credentials') return reply(404, { error: 'Not found' })
    if (!env.ALLOWED_ORIGIN || origin !== env.ALLOWED_ORIGIN) return reply(403, { error: 'Forbidden' })
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' })
    if (!env.TURN_KEY_ID || !env.TURN_API_TOKEN || !env.IP_LIMITER || !env.GLOBAL_LIMITER) {
      return reply(503, { error: 'Relay unavailable' })
    }
    try {
      const ip = request.headers.get('CF-Connecting-IP')
      if (!ip) return reply(403, { error: 'Forbidden' })
      // Best-effort edge limits, not authentication or a global billing cap.
      const individual = await env.IP_LIMITER.limit({ key: ip })
      if (!individual.success) return reply(429, { error: 'Please try again shortly' })
      const global = await env.GLOBAL_LIMITER.limit({ key: 'credentials' })
      if (!global.success) return reply(429, { error: 'Please try again shortly' })
      const response = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.TURN_API_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ttl: 7200 }),
          signal: AbortSignal.timeout(6000),
        },
      )
      if (!response.ok) return reply(502, { error: 'Relay unavailable' })
      const data = await response.json() as { iceServers?: RTCIceServer[] }
      // Return only TURN connection credentials. Drop metadata and blocked port 53.
      const turn = (data.iceServers ?? []).map((server) => ({
        urls: (Array.isArray(server.urls) ? server.urls : [server.urls])
          .filter((url) => typeof url === 'string' && /^turns?:/.test(url) && !/:53(?:\?|$)/.test(url)),
        username: server.username,
        credential: server.credential,
      })).filter((server) => server.urls.length > 0)
      const iceServers = parseTurnServers(JSON.stringify(turn))
      return reply(200, { iceServers, expiresAt: Date.now() + 7200 * 1000 })
    } catch {
      // Never expose or log provider responses, keys, or generated credentials.
      return reply(502, { error: 'Relay unavailable' })
    }
  },
}
