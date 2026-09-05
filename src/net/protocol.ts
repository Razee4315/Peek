import type { GameMode, PlayerId, SeatView, SecretValue } from '../game/types'

/** Room codes map to PeerJS peer ids on the public signaling server. */
export const ROOM_PREFIX = 'peek-v2-'
export const CODE_ALPHABET = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeRoomCode(len = 5): string {
  let code = ''
  const buf = new Uint32Array(len)
  crypto.getRandomValues(buf)
  for (let i = 0; i < len; i++) code += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length]
  return code
}

export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

/** Guest → host. The guest never sends or receives full session state. */
export type ClientMsg =
  | { t: 'hello'; name: string }
  | { t: 'lock'; value: SecretValue }
  | { t: 'guess'; value: SecretValue }
  | { t: 'rematch' }

/** Host → guest. Views are seat-scoped projections produced by selectView(). */
export type HostMsg =
  | { t: 'welcome'; seat: PlayerId; mode: GameMode; view: SeatView }
  | { t: 'view'; view: SeatView }
  | { t: 'full' }
