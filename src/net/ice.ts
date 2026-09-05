import { parseTurnServers } from './turnServers'
export { parseTurnServers } from './turnServers'

export async function peerOptions(signal?: AbortSignal) {
  const endpoint = import.meta.env.VITE_RELAY_URL?.trim()
  if (!endpoint) throw new Error('Relay service is not configured')
  const url = new URL(endpoint)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost')) {
    throw new Error('Relay endpoint must use HTTPS')
  }
  if (url.username || url.password || url.search) throw new Error('Invalid relay endpoint')
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, 8000)
  try {
    const response = await fetch(url, { method: 'POST', credentials: 'omit', cache: 'no-store', signal: controller.signal })
    if (!response.ok) throw new Error('Relay service unavailable')
    const body = await response.json()
    const servers = parseTurnServers(JSON.stringify(body.iceServers))
    if (!servers.length) throw new Error('Relay service returned no servers')
    return { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, ...servers] } }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export function relayConfigured(): boolean { return Boolean(import.meta.env.VITE_RELAY_URL?.trim()) }
