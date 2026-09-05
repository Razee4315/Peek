import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fake = vi.hoisted(() => {
  class Emitter {
    listeners = new Map<string, ((...args: any[]) => void)[]>()
    on(event: string, fn: (...args: any[]) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), fn])
      return this
    }
    emit(event: string, ...args: any[]) { for (const fn of this.listeners.get(event) ?? []) fn(...args) }
  }
  class Connection extends Emitter {
    open = false
    send = vi.fn()
    close = vi.fn(() => { this.open = false; this.emit('close') })
  }
  const peers: Peer[] = []
  class Peer extends Emitter {
    args: unknown[]
    connection = new Connection()
    connect = vi.fn(() => this.connection)
    destroy = vi.fn(() => this.connection.close())
    constructor(...args: unknown[]) { super(); this.args = args; peers.push(this) }
  }
  return { Peer, Connection, peers }
})
vi.mock('peerjs', () => ({ default: fake.Peer }))
vi.mock('../src/net/ice', () => ({ peerOptions: vi.fn(async () => ({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } })) }))
import { peerOptions } from '../src/net/ice'
import { CONNECTION_TIMEOUT_MS, GuestConnection, HostRoom } from '../src/net/peer'
import { createSession, selectView } from '../src/game/engine'

const guestHandlers = () => ({ onConnected: vi.fn(), onWelcome: vi.fn(), onView: vi.fn(), onRoomFull: vi.fn(), onHostLeft: vi.fn(), onError: vi.fn() })
const hostHandlers = () => ({ onWaiting: vi.fn(), onIdTaken: vi.fn(), onGuestHello: vi.fn(), onGuestMsg: vi.fn(), onGuestLeft: vi.fn(), onError: vi.fn() })
beforeEach(() => { vi.useFakeTimers(); fake.peers.length = 0 })
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers() })

describe('room transport lifecycle', () => {
  it('uses explicit ICE settings without the discontinued bundled TURN servers', async () => {
    await new HostRoom().start('ABCDE', hostHandlers())
    await new GuestConnection().join('ABCDE', guestHandlers())
    expect(fake.peers[0].args).toEqual(['peek-v2-ABCDE', { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } }])
    expect(fake.peers[1].args).toEqual([{ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } }])
  })
  it('times out a connection that never opens, and suppresses later callbacks', async () => {
    const guest = new GuestConnection(), h = guestHandlers()
    await guest.join('ABCDE', h)
    const peer = fake.peers[0]
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    expect(h.onError).toHaveBeenCalledOnce()
    expect(h.onError).toHaveBeenCalledWith('timeout')
    peer.emit('open')
    expect(peer.connect).not.toHaveBeenCalled()
    expect(h.onHostLeft).not.toHaveBeenCalled()
  })
  it('keeps a deadline until welcome, not just channel open', async () => {
    const h = guestHandlers()
    await new GuestConnection().join('ABCDE', h)
    const peer = fake.peers[0]
    peer.emit('open'); peer.connection.emit('open')
    expect(h.onConnected).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    expect(h.onError).toHaveBeenCalledWith('timeout')
  })
  it('clears the deadline on welcome and reports a later disconnect once', async () => {
    const h = guestHandlers()
    await new GuestConnection().join('ABCDE', h)
    const peer = fake.peers[0]
    peer.emit('open')
    const view = selectView(createSession({ mode: 'numbers', play: 'online' }), 'p2')
    peer.connection.emit('data', { t: 'welcome', seat: 'p2', mode: 'numbers', view })
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    expect(h.onError).not.toHaveBeenCalled()
    peer.connection.emit('close'); peer.connection.emit('error')
    expect(h.onHostLeft).toHaveBeenCalledOnce()
  })
  it('cancels old attempts without allowing stale errors into a new join', async () => {
    const guest = new GuestConnection(), old = guestHandlers(), next = guestHandlers()
    await guest.join('ABCDE', old)
    const peer = fake.peers[0]
    await guest.join('FGHJK', next)
    peer.emit('error', { type: 'peer-unavailable' }); peer.emit('open')
    expect(old.onError).not.toHaveBeenCalled()
    expect(peer.connect).not.toHaveBeenCalled()
    guest.close()
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    expect(next.onError).not.toHaveBeenCalled()
  })
  it('reserves a pending seat and ignores commands before hello', async () => {
    const h = hostHandlers()
    await new HostRoom().start('ABCDE', h)
    const peer = fake.peers[0], first = new fake.Connection(), second = new fake.Connection()
    peer.emit('open'); peer.emit('connection', first); peer.emit('connection', second)
    second.emit('open')
    expect(second.send).toHaveBeenCalledWith({ t: 'full' })
    first.emit('data', { t: 'guess', value: 50 })
    expect(h.onGuestMsg).not.toHaveBeenCalled()
    first.emit('data', { t: 'hello', name: 'Maya' })
    first.emit('data', { t: 'hello', name: 'Someone else' })
    first.emit('data', { t: 'guess', value: {} })
    expect(h.onGuestHello).toHaveBeenCalledOnce()
    expect(h.onGuestMsg).not.toHaveBeenCalled()
    first.emit('data', { t: 'guess', value: 50 })
    expect(h.onGuestMsg).toHaveBeenCalledWith({ t: 'guess', value: 50 })
  })
  it('releases an unresponsive guest reservation so a new guest can join', async () => {
    const h = hostHandlers()
    await new HostRoom().start('ABCDE', h)
    const peer = fake.peers[0], first = new fake.Connection(), second = new fake.Connection()
    peer.emit('open'); peer.emit('connection', first)
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    peer.emit('connection', second)
    second.emit('data', { t: 'hello', name: 'Sam' })
    expect(h.onGuestHello).toHaveBeenCalledOnce()
    expect(h.onGuestLeft).not.toHaveBeenCalled()
  })
  it('bounds room creation and suppresses close callbacks after intentional shutdown', async () => {
    const room = new HostRoom(), h = hostHandlers()
    await room.start('ABCDE', h)
    vi.advanceTimersByTime(CONNECTION_TIMEOUT_MS)
    expect(h.onError).toHaveBeenCalledOnce()
    expect(h.onError).toHaveBeenCalledWith('network')
    await room.start('FGHJK', h)
    const peer = fake.peers[1], conn = new fake.Connection()
    peer.emit('open'); peer.emit('connection', conn)
    conn.emit('data', { t: 'hello', name: 'Sam' })
    room.close()
    expect(h.onGuestLeft).not.toHaveBeenCalled()
  })
})


describe('credential preparation cancellation', () => {
  it('does not create a peer when a cancelled credential request finishes late', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof peerOptions>>) => void
    vi.mocked(peerOptions).mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const guest = new GuestConnection(), h = guestHandlers()
    const joining = guest.join('ABCDE', h)
    guest.close()
    resolve({ config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } })
    await joining
    expect(fake.peers).toHaveLength(0)
    expect(h.onError).not.toHaveBeenCalled()
  })
})
