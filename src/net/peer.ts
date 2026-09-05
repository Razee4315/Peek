import Peer, { type DataConnection } from 'peerjs'
import { ROOM_PREFIX, type ClientMsg, type HostMsg } from './protocol'

/**
 * Thin wrappers over PeerJS for the two roles. The public PeerServer is used
 * only for signaling; game data flows over the WebRTC data channel directly.
 *
 * Players are usually on different home networks (different cities), so offer
 * several independent STUN servers for NAT traversal. PeerJS's default is a
 * single Google STUN server; more candidates make cross-network connections
 * far more reliable. There is no TURN relay — fully blocked networks (some
 * office/school firewalls) cannot connect and surface a friendly error.
 */
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
]

const PEER_OPTIONS = { config: { iceServers: ICE_SERVERS } }

export type HostHandlers = {
  onWaiting(): void
  onIdTaken(): void
  onGuestHello(name: string, reply: (msg: HostMsg) => void): void
  onGuestMsg(msg: ClientMsg): void
  onGuestLeft(): void
  onError(kind: 'network'): void
}

export class HostRoom {
  private peer: Peer | null = null
  private conn: DataConnection | null = null

  start(code: string, h: HostHandlers): void {
    this.close()
    const peer = new Peer(ROOM_PREFIX + code, PEER_OPTIONS)
    this.peer = peer

    peer.on('open', () => h.onWaiting())

    peer.on('connection', (conn) => {
      if (this.conn && this.conn.open) {
        // One duel per room: tell the second arrival it is full.
        conn.on('open', () => {
          conn.send({ t: 'full' } satisfies HostMsg)
          setTimeout(() => conn.close(), 300)
        })
        return
      }
      this.conn = conn
      conn.on('data', (raw) => {
        const msg = raw as ClientMsg
        if (!msg || typeof msg !== 'object') return
        if (msg.t === 'hello') h.onGuestHello(String(msg.name ?? ''), (m) => conn.send(m))
        else h.onGuestMsg(msg)
      })
      const left = () => h.onGuestLeft()
      conn.on('close', left)
      conn.on('error', left)
    })

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') h.onIdTaken()
      else if (err.type !== 'peer-unavailable') h.onError('network')
    })
  }

  send(msg: HostMsg): void {
    if (this.conn && this.conn.open) this.conn.send(msg)
  }

  close(): void {
    try {
      this.conn?.close()
    } catch {
      /* already gone */
    }
    try {
      this.peer?.destroy()
    } catch {
      /* already gone */
    }
    this.conn = null
    this.peer = null
  }
}

export type GuestHandlers = {
  onConnected(): void
  onWelcome(msg: Extract<HostMsg, { t: 'welcome' }>): void
  onView(msg: Extract<HostMsg, { t: 'view' }>): void
  onRoomFull(): void
  onHostLeft(): void
  onError(kind: 'not-found' | 'network' | 'incompatible'): void
}

export class GuestConnection {
  private peer: Peer | null = null
  private conn: DataConnection | null = null

  join(code: string, h: GuestHandlers): void {
    this.close()
    const peer = new Peer(PEER_OPTIONS)
    this.peer = peer

    peer.on('error', (err) => {
      if (err.type === 'peer-unavailable') h.onError('not-found')
      else if (err.type === 'browser-incompatible') h.onError('incompatible')
      else h.onError('network')
    })

    peer.on('open', () => {
      const conn = peer.connect(ROOM_PREFIX + code, { reliable: true })
      this.conn = conn
      conn.on('open', () => h.onConnected())
      conn.on('data', (raw) => {
        const msg = raw as HostMsg
        if (!msg || typeof msg !== 'object') return
        if (msg.t === 'welcome') h.onWelcome(msg)
        else if (msg.t === 'view') h.onView(msg)
        else if (msg.t === 'full') h.onRoomFull()
      })
      conn.on('close', () => h.onHostLeft())
      conn.on('error', () => h.onHostLeft())
    })
  }

  sendHello(name: string): void {
    this.conn?.send({ t: 'hello', name } satisfies ClientMsg)
  }

  send(msg: ClientMsg): void {
    if (this.conn && this.conn.open) this.conn.send(msg)
  }

  close(): void {
    try {
      this.conn?.close()
    } catch {
      /* already gone */
    }
    try {
      this.peer?.destroy()
    } catch {
      /* already gone */
    }
    this.conn = null
    this.peer = null
  }
}
