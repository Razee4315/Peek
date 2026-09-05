import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseTurnServers, peerOptions, relayConfigured } from '../src/net/ice'
afterEach(() => vi.unstubAllEnvs())
describe('relay configuration', () => {
  it('uses only STUN when no provider has been configured', () => {
    expect(parseTurnServers('')).toEqual([])
    expect(JSON.stringify(peerOptions(''))).not.toContain('turn.peerjs.com')
  })
  it('passes issued TCP/TLS TURN credentials into ICE settings', () => {
    const server = { urls: ['turns:relay.example.com:443?transport=tcp'], username: 'browser-user', credential: 'test-only' }
    const raw = JSON.stringify([server])
    expect(peerOptions(raw).config.iceServers).toContainEqual(server)
    vi.stubEnv('VITE_TURN_SERVERS', raw)
    expect(relayConfigured()).toBe(true)
  })
  it('rejects malformed or incomplete relay settings without exposing their contents', () => {
    for (const raw of ['not-json', '{}', '[]', '[null]', '[{"urls":"https://example.com","username":"x","credential":"private-test"}]', '[{"urls":"turn:relay.example.com"}]']) {
      expect(() => parseTurnServers(raw)).toThrow('Invalid relay configuration')
    }
  })
})
