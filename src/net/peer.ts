import Peer, { type DataConnection } from 'peerjs'
import { peerOptions } from './ice'
import { ROOM_PREFIX, type ClientMsg, type HostMsg } from './protocol'

// Use configured TURN servers. PeerJS bundled free relays were discontinued.
export const CONNECTION_TIMEOUT_MS = 25000
export type HostHandlers = {
  onWaiting(): void
  onIdTaken(): void
  onGuestHello(name: string, reply: (msg: HostMsg) => void): void
  onGuestMsg(msg: ClientMsg): void
  onGuestLeft(): void
  onError(kind: 'network' | 'relay-config'): void
}
export class HostRoom {
  private peer: Peer | null = null
  private preparation: AbortController | null = null
  private conn: DataConnection | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private guestTimer: ReturnType<typeof setTimeout> | undefined
  async start(code: string, h: HostHandlers): Promise<void> {
    this.close()
    const preparation = new AbortController()
    this.preparation = preparation
    let options: Awaited<ReturnType<typeof peerOptions>>
    try { options = await peerOptions(preparation.signal) } catch {
      if (this.preparation === preparation && !preparation.signal.aborted) h.onError('relay-config')
      return
    }
    if (this.preparation !== preparation || preparation.signal.aborted) return
    const peer = new Peer(ROOM_PREFIX + code, options)
    this.peer = peer
    const current = () => this.peer === peer
    this.timer = setTimeout(() => {
      if (!current()) return
      this.close()
      h.onError('network')
    }, CONNECTION_TIMEOUT_MS)
    peer.on('open', () => {
      if (!current()) return
      clearTimeout(this.timer)
      h.onWaiting()
    })
    peer.on('connection', (conn) => {
      if (!current()) { conn.close(); return }
      // Reserve the seat during negotiation as well as after open.
      if (this.conn) {
        const timer = setTimeout(() => conn.close(), CONNECTION_TIMEOUT_MS)
        conn.on('open', () => {
          conn.send({ t: 'full' } satisfies HostMsg)
          clearTimeout(timer)
          setTimeout(() => conn.close(), 300)
        })
        conn.on('close', () => clearTimeout(timer))
        return
      }
      this.conn = conn
      let greeted = false
      const active = () => current() && this.conn === conn
      const left = () => {
        if (!active()) return
        this.conn = null
        clearTimeout(this.guestTimer)
        conn.close()
        if (greeted) h.onGuestLeft()
        else h.onWaiting()
      }
      this.guestTimer = setTimeout(left, CONNECTION_TIMEOUT_MS)
      conn.on('data', (raw) => {
        if (!active() || !raw || typeof raw !== 'object') return
        const msg = raw as ClientMsg
        if (msg.t === 'hello' && !greeted && typeof msg.name === 'string') {
          greeted = true
          clearTimeout(this.guestTimer)
          h.onGuestHello(msg.name, (m) => { if (active()) conn.send(m) })
        } else if (greeted && (msg.t === 'rematch' ||
          ((msg.t === 'lock' || msg.t === 'guess') &&
            (typeof msg.value === 'string' || typeof msg.value === 'number')))) h.onGuestMsg(msg)
      })
      conn.on('close', left)
      conn.on('error', left)
    })
    peer.on('error', (err) => {
      if (!current()) return
      this.close()
      if (err.type === 'unavailable-id') h.onIdTaken()
      else h.onError('network')
    })
  }
  send(msg: HostMsg): void { if (this.conn?.open) this.conn.send(msg) }
  close(): void {
    this.preparation?.abort()
    this.preparation = null
    clearTimeout(this.timer)
    clearTimeout(this.guestTimer)
    const conn = this.conn
    const peer = this.peer
    this.conn = null
    this.peer = null
    try { conn?.close() } catch { /* already closed */ }
    try { peer?.destroy() } catch { /* already closed */ }
  }
}
export type GuestHandlers = {
  onConnected(): void
  onWelcome(msg: Extract<HostMsg, { t: 'welcome' }>): void
  onView(msg: Extract<HostMsg, { t: 'view' }>): void
  onRoomFull(): void
  onHostLeft(): void
  onError(kind: 'not-found' | 'network' | 'incompatible' | 'timeout' | 'relay-config'): void
}
export class GuestConnection {
  private peer: Peer | null = null
  private preparation: AbortController | null = null
  private conn: DataConnection | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  async join(code: string, h: GuestHandlers): Promise<void> {
    this.close()
    const preparation = new AbortController()
    this.preparation = preparation
    let options: Awaited<ReturnType<typeof peerOptions>>
    try { options = await peerOptions(preparation.signal) } catch {
      if (this.preparation === preparation && !preparation.signal.aborted) h.onError('relay-config')
      return
    }
    if (this.preparation !== preparation || preparation.signal.aborted) return
    const peer = new Peer(options)
    this.peer = peer
    const current = () => this.peer === peer
    const fail = (kind: Parameters<GuestHandlers['onError']>[0]) => {
      if (!current()) return
      this.close()
      h.onError(kind)
    }
    // Bound broker lookup, ICE negotiation, and application welcome together.
    this.timer = setTimeout(() => fail('timeout'), CONNECTION_TIMEOUT_MS)
    peer.on('error', (err) => {
      fail(err.type === 'peer-unavailable' ? 'not-found' :
        err.type === 'browser-incompatible' ? 'incompatible' : 'network')
    })
    peer.on('open', () => {
      if (!current()) return
      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true })
      this.conn = conn
      let welcomed = false
      conn.on('open', () => { if (current()) h.onConnected() })
      conn.on('data', (raw) => {
        if (!current() || !raw || typeof raw !== 'object') return
        const msg = raw as HostMsg
        if (msg.t === 'welcome' && !welcomed && msg.seat === 'p2' && msg.view) {
          welcomed = true
          clearTimeout(this.timer)
          h.onWelcome(msg)
        } else if (msg.t === 'view' && welcomed && msg.view) h.onView(msg)
        else if (msg.t === 'full') { this.close(); h.onRoomFull() }
      })
      const left = () => {
        if (!current()) return
        this.close()
        if (welcomed) h.onHostLeft()
        else h.onError('network')
      }
      conn.on('close', left)
      conn.on('error', left)
    })
  }
  sendHello(name: string): void { this.send({ t: 'hello', name }) }
  send(msg: ClientMsg): void { if (this.conn?.open) this.conn.send(msg) }
  close(): void {
    this.preparation?.abort()
    this.preparation = null
    clearTimeout(this.timer)
    const conn = this.conn
    const peer = this.peer
    this.conn = null
    this.peer = null
    try { conn?.close() } catch { /* already closed */ }
    try { peer?.destroy() } catch { /* already closed */ }
  }
}
