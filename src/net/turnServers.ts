/** TURN credentials are client credentials, never a provider's account/API key. */
export function parseTurnServers(raw: string | undefined): RTCIceServer[] {
  if (!raw?.trim()) return []
  let servers: unknown
  try { servers = JSON.parse(raw) } catch { throw new Error('Invalid relay configuration') }
  if (!Array.isArray(servers) || servers.length === 0) throw new Error('Invalid relay configuration')
  return servers.map((server) => {
    if (!server || typeof server !== 'object') throw new Error('Invalid relay configuration')
    const urls = typeof server.urls === 'string' ? [server.urls] : server.urls
    if (!Array.isArray(urls) || !urls.length ||
      !urls.every((url: unknown) => typeof url === 'string' && /^turns?:[^\s]+$/.test(url)) ||
      typeof server.username !== 'string' || !server.username.trim() ||
      typeof server.credential !== 'string' || !server.credential.trim()) {
      throw new Error('Invalid relay configuration')
    }
    return { urls, username: server.username, credential: server.credential }
  })
}

