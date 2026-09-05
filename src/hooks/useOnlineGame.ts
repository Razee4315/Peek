import { relayConfigured } from '../net/ice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { applyCommand, createSession, selectView, cleanName } from '../game/engine'
import type { Command } from '../game/types'
import type { GameMode, SeatView, Session } from '../game/types'
import { GuestConnection, HostRoom } from '../net/peer'
import { makeRoomCode, normalizeRoomCode, type ClientMsg } from '../net/protocol'

export type OnlineState =
  | { st: 'lobby' }
  | { st: 'creating' }
  | { st: 'hosting'; code: string }
  | { st: 'joining'; code: string }
  | { st: 'live'; view: SeatView }
  | { st: 'opponentLeft'; view: SeatView | null }
  | { st: 'error'; message: string }

/**
 * Host-authoritative online play over a WebRTC data channel. The host owns the
 * session; the guest only ever receives seat-scoped views (never the opponent's
 * secret before the result) and sends commands that the host validates.
 */
export function useOnlineGame() {
  const [state, setState] = useState<OnlineState>({ st: 'lobby' })
  const sessionRef = useRef<Session | null>(null)
  const hostRef = useRef<HostRoom | null>(null)
  const guestRef = useRef<GuestConnection | null>(null)
  const hostNameRef = useRef('')

  const leave = useCallback(() => {
    hostRef.current?.close()
    guestRef.current?.close()
    hostRef.current = null
    guestRef.current = null
    sessionRef.current = null
    setState({ st: 'lobby' })
  }, [])

  useEffect(() => {
    const onUnload = () => {
      hostRef.current?.close()
      guestRef.current?.close()
    }
    window.addEventListener('pagehide', onUnload)
    return () => {
      window.removeEventListener('pagehide', onUnload)
      onUnload()
    }
  }, [])

  const hostApply = useCallback((cmd: Command) => {
    const session = sessionRef.current
    if (!session) return
    const next = applyCommand(session, cmd)
    sessionRef.current = next
    // Re-send the view after every message (even rejected ones) so seats never desync.
    hostRef.current?.send({ t: 'view', view: selectView(next, 'p2') })
    setState({ st: 'live', view: selectView(next, 'p1') })
  }, [])

  const hostRoom = useCallback(
    (mode: GameMode, rawName: string) => {
      leave()
      hostNameRef.current = cleanName(rawName) ?? 'Player 1'
      setState({ st: 'creating' })

      const startAttempt = (triesLeft: number) => {
        const code = makeRoomCode()
        const room = new HostRoom()
        hostRef.current = room
        room.start(code, {
          onWaiting: () => setState({ st: 'hosting', code }),
          onIdTaken: () => {
            room.close()
            if (triesLeft > 0) startAttempt(triesLeft - 1)
            else
              setState({
                st: 'error',
                message: 'Could not get a free room code. Please try again.',
              })
          },
          onGuestHello: (name, reply) => {
            if (sessionRef.current) return // duel already running
            const session = createSession({
              mode,
              play: 'online',
              names: { p1: hostNameRef.current, p2: cleanName(name) ?? 'Player 2' },
            })
            sessionRef.current = session
            reply({ t: 'welcome', seat: 'p2', mode, view: selectView(session, 'p2') })
            setState({ st: 'live', view: selectView(session, 'p1') })
          },
          onGuestMsg: (msg: ClientMsg) => {
            if (msg.t === 'lock') hostApply({ type: 'LOCK_SECRET', seat: 'p2', value: msg.value })
            if (msg.t === 'guess') hostApply({ type: 'SUBMIT_GUESS', seat: 'p2', value: msg.value })
            if (msg.t === 'rematch') hostApply({ type: 'VOTE_REMATCH', seat: 'p2' })
          },
          onGuestLeft: () => {
            room.close()
            sessionRef.current = null
            setState((s) => (s.st === 'live' ? { st: 'opponentLeft', view: s.view } : { st: 'lobby' }))
          },
          onError: (kind) =>
            setState({
              st: 'error',
              message: kind === 'relay-config' ? 'The relay service is unavailable. Please try again shortly.' : 'Connection trouble. Check your internet and try again.',
            }),
        })
      }
      startAttempt(3)
    },
    [hostApply, leave],
  )

  const joinRoom = useCallback(
    (rawCode: string, rawName: string) => {
      leave()
      const code = normalizeRoomCode(rawCode)
      if (code.length !== 5) {
        setState({ st: 'error', message: 'Enter the full room code your friend shared.' })
        return
      }
      setState({ st: 'joining', code })
      const conn = new GuestConnection()
      guestRef.current = conn
      let greeted = false
      conn.join(code, {
        onConnected: () => {
          if (!greeted) {
            greeted = true
            conn.sendHello(cleanName(rawName) ?? 'Player 2')
          }
        },
        onWelcome: (msg) => setState({ st: 'live', view: msg.view }),
        onView: (msg) => setState({ st: 'live', view: msg.view }),
        onRoomFull: () => {
          conn.close()
          setState({ st: 'error', message: 'That room already has two players.' })
        },
        onHostLeft: () =>
          setState((s) => (s.st === 'live' ? { st: 'opponentLeft', view: s.view } : { st: 'lobby' })),
        onError: (kind) => {
          conn.close()
          setState({
            st: 'error',
            message:
              kind === 'relay-config'
                ? 'The relay service is unavailable. Please try again shortly.'
                : kind === 'not-found'
                ? `No room found with code ${code}. Check the code, or ask your friend to create one.`
                : kind === 'timeout'
                  ? relayConfigured()
                    ? 'The devices could not connect. The relay may be unavailable or blocked. Keep the host room open and try again.'
                    : 'The devices could not connect directly. This site needs a working relay configured for these networks.'
                : kind === 'incompatible'
                  ? 'This browser cannot make peer connections.'
                  : 'Could not reach the room service. Check your internet and try again.',
          })
        },
      })
    },
    [leave],
  )

  // Guest actions travel to the host; host actions go straight to the reducer.
  const asGuest = () => state.st === 'live' && state.view.you === 'p2'

  const lock = useCallback(
    (value: number | string) => {
      if (state.st !== 'live') return
      if (asGuest()) guestRef.current?.send({ t: 'lock', value })
      else hostApply({ type: 'LOCK_SECRET', seat: 'p1', value })
    },
    [hostApply, state],
  )

  const guess = useCallback(
    (value: number | string) => {
      if (state.st !== 'live') return
      if (asGuest()) guestRef.current?.send({ t: 'guess', value })
      else hostApply({ type: 'SUBMIT_GUESS', seat: 'p1', value })
    },
    [hostApply, state],
  )

  const rematch = useCallback(() => {
    if (state.st !== 'live') return
    if (asGuest()) guestRef.current?.send({ t: 'rematch' })
    else hostApply({ type: 'VOTE_REMATCH', seat: 'p1' })
  }, [hostApply, state])

  return { state, hostRoom, joinRoom, lock, guess, rematch, leave }
}
