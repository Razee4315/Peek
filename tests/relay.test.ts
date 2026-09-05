import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from '../relay/src/index'
import { peerOptions } from '../src/net/ice'

const issued = { urls: ['turns:turn.cloudflare.com:443?transport=tcp'], username: 'temporary', credential: 'temporary-password' }
const env = (): Env => ({ TURN_KEY_ID: 'key-id', TURN_API_TOKEN: 'private-provider-token', ALLOWED_ORIGIN: 'https://razee4315.github.io', IP_LIMITER: { limit: vi.fn(async () => ({ success: true })) }, GLOBAL_LIMITER: { limit: vi.fn(async () => ({ success: true })) } })
const request = (origin = 'https://razee4315.github.io', method = 'POST') => new Request('https://relay.example/credentials', { method, headers: { Origin: origin, 'CF-Connecting-IP': '192.0.2.1' } })
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('private relay backend', () => {
  it('issues temporary credentials without exposing the provider token', async () => {
    const upstream = vi.fn(async () => Response.json({ iceServers: [{ urls: ['stun:stun.cloudflare.com:53'] }, issued], ignoredSecret: 'private-provider-token' }))
    vi.stubGlobal('fetch', upstream)
    const response = await worker.fetch(request(), env())
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    const body = await response.text()
    expect(body).toContain('temporary-password')
    expect(body).not.toContain('private-provider-token')
    expect(body).not.toContain(':53')
    expect(upstream.mock.calls[0][1].body).toBe(JSON.stringify({ ttl: 7200 }))
  })
  it('rejects other origins and rate-limited requests before calling the provider', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream)
    expect((await worker.fetch(request('https://other.example'), env())).status).toBe(403)
    const limited = env(); limited.IP_LIMITER.limit = vi.fn(async () => ({ success: false }))
    expect((await worker.fetch(request(), limited)).status).toBe(429)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('handles preflight without generating credentials', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream)
    const response = await worker.fetch(request(undefined, 'OPTIONS'), env())
    expect(response.status).toBe(204)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('does not forward provider errors or malformed results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('private-provider-token', { status: 401 })))
    const response = await worker.fetch(request(), env())
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('private-provider-token')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ iceServers: [] })))
    expect((await worker.fetch(request(), env())).status).toBe(502)
  })
})

describe('browser credential fetching', () => {
  it('fetches fresh temporary credentials using only a public endpoint', async () => {
    vi.stubEnv('VITE_RELAY_URL', 'https://relay.example/credentials')
    const transport = vi.fn(async () => Response.json({ iceServers: [issued] }))
    vi.stubGlobal('fetch', transport)
    expect((await peerOptions()).config.iceServers).toContainEqual(issued)
    const options = transport.mock.calls[0][1]
    expect(options).toMatchObject({ method: 'POST', credentials: 'omit', cache: 'no-store' })
    expect(options).not.toHaveProperty('headers')
  })
  it('does not silently fall back to a broken direct-only session', async () => {
    vi.stubEnv('VITE_RELAY_URL', '')
    await expect(peerOptions()).rejects.toThrow('not configured')
    vi.stubEnv('VITE_RELAY_URL', 'https://relay.example/credentials')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    await expect(peerOptions()).rejects.toThrow('unavailable')
  })
  it('rejects insecure endpoints and malformed credentials', async () => {
    vi.stubEnv('VITE_RELAY_URL', 'http://relay.example/credentials')
    await expect(peerOptions()).rejects.toThrow('HTTPS')
    vi.stubEnv('VITE_RELAY_URL', 'https://relay.example/credentials')
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ iceServers: [{ urls: 'turns:relay.example:443' }] })))
    await expect(peerOptions()).rejects.toThrow('Invalid relay')
  })
})
