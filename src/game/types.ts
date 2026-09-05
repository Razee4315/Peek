/** Core game types shared by the local (shared-device) and online (room) modes. */

export type PlayerId = 'p1' | 'p2'

/** 'numbers' = hot/cold duel on 0–100. 'bulls' = 4-digit Bulls & Cows code break. */
export type GameMode = 'numbers' | 'bulls'

/** Where the game is played. Local = two people, one device. Online = a room. */
export type PlayKind = 'local' | 'online'

/** numbers mode stores a number; bulls mode stores a 4-character digit string like '0473'. */
export type SecretValue = number | string

export type Hint =
  | { kind: 'higher' }
  | { kind: 'lower' }
  | { kind: 'bc'; bulls: number; cows: number }
  | { kind: 'correct' }

export interface Attempt {
  value: SecretValue
  hint: Hint
}

export type Phase =
  | { step: 'handoff'; recipient: PlayerId; destination: 'secret' | 'guess' }
  | { step: 'setup' }
  | { step: 'guess' }
  | { step: 'feedback' }
  | { step: 'result'; winner: PlayerId }

export interface Session {
  mode: GameMode
  play: PlayKind
  names: Record<PlayerId, string>
  scores: Record<PlayerId, number>
  round: number
  startingPlayer: PlayerId
  activePlayer: PlayerId
  secrets: Record<PlayerId, SecretValue | null>
  locked: Record<PlayerId, boolean>
  guesses: Record<PlayerId, Attempt[]>
  rematchVotes: Record<PlayerId, boolean>
  phase: Phase
}

export type Command =
  | { type: 'ACK_HANDOFF' }
  | { type: 'LOCK_SECRET'; seat: PlayerId; value: SecretValue }
  | { type: 'SUBMIT_GUESS'; seat: PlayerId; value: SecretValue }
  | { type: 'PASS_DEVICE' }
  | { type: 'VOTE_REMATCH'; seat: PlayerId }

/**
 * What one seat is allowed to see. The online guest only ever receives this —
 * never the full session, and never the opponent's secret before the result.
 */
export type ScreenView =
  | { screen: 'handoff'; recipient: PlayerId; destination: 'secret' | 'guess' }
  | { screen: 'setup'; entrySeat: PlayerId; bothLocked: boolean }
  | { screen: 'setupWaiting' }
  | { screen: 'yourGuess' }
  | { screen: 'waitingGuess'; actor: PlayerId }
  | { screen: 'feedback' }
  | { screen: 'result'; winner: PlayerId }

export interface SeatView {
  mode: GameMode
  play: PlayKind
  you: PlayerId
  names: Record<PlayerId, string>
  scores: Record<PlayerId, number>
  round: number
  startingPlayer: PlayerId
  yourSecret: SecretValue | null
  yourSecretLocked: boolean
  yourGuesses: Attempt[]
  /** numbers mode only: inclusive range still possible for your own hunt. */
  range: [number, number] | null
  step: ScreenView
  /** result only: both secrets, revealed. */
  revealed: Record<PlayerId, SecretValue> | null
  rematchVotes: Record<PlayerId, boolean>
}

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1')

export const DEFAULT_NAMES: Record<PlayerId, string> = { p1: 'Player 1', p2: 'Player 2' }
