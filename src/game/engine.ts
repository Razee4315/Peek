import { countBullsCows, validateGuess, validateSecret } from './validate'
import {
  type Command,
  type GameMode,
  type PlayerId,
  type PlayKind,
  type SeatView,
  type Session,
  DEFAULT_NAMES,
  other,
} from './types'

export interface SessionOptions {
  mode: GameMode
  play: PlayKind
  names?: Record<PlayerId, string>
  startingPlayer?: PlayerId
}

export function createSession(opts: SessionOptions): Session {
  const startingPlayer = opts.startingPlayer ?? 'p1'
  const names: Record<PlayerId, string> = {
    p1: cleanName(opts.names?.p1) ?? DEFAULT_NAMES.p1,
    p2: cleanName(opts.names?.p2) ?? DEFAULT_NAMES.p2,
  }
  return {
    mode: opts.mode,
    play: opts.play,
    names,
    scores: { p1: 0, p2: 0 },
    round: 1,
    startingPlayer,
    activePlayer: startingPlayer,
    secrets: { p1: null, p2: null },
    locked: { p1: false, p2: false },
    guesses: { p1: [], p2: [] },
    rematchVotes: { p1: false, p2: false },
    // Local play passes one device, so every private moment starts behind a handoff.
    // Online play has private screens by nature, so both seats set up simultaneously.
    phase:
      opts.play === 'local'
        ? { step: 'handoff', recipient: 'p1', destination: 'secret' }
        : { step: 'setup' },
  }
}

export function cleanName(raw: string | undefined): string | null {
  const name = (raw ?? '').trim().slice(0, 20).trim()
  return name === '' ? null : name
}

/** Who may submit the next guess: the active player, or — after a wrong guess online — the other seat. */
export function nextActor(s: Session): PlayerId {
  if (s.phase.step === 'guess') return s.activePlayer
  if (s.phase.step === 'feedback') return other(s.activePlayer)
  return s.activePlayer
}

/**
 * Pure reducer. Commands invalid for the current phase or seat are rejected
 * without mutation (same object returned), which also absorbs double submits.
 */
export function applyCommand(state: Session, cmd: Command): Session {
  switch (cmd.type) {
    case 'ACK_HANDOFF': {
      if (state.phase.step !== 'handoff') return state
      return {
        ...state,
        phase: state.phase.destination === 'secret' ? { step: 'setup' } : { step: 'guess' },
      }
    }

    case 'LOCK_SECRET': {
      if (state.phase.step !== 'setup') return state
      if (state.locked[cmd.seat]) return state
      const parsed = validateSecret(state.mode, String(cmd.value))
      if (!parsed.ok) return state
      const secrets = { ...state.secrets, [cmd.seat]: parsed.value }
      const locked = { ...state.locked, [cmd.seat]: true }
      const allLocked = locked.p1 && locked.p2
      let phase: Session['phase'] = { step: 'setup' }
      if (allLocked) {
        phase =
          state.play === 'local'
            ? { step: 'handoff', recipient: state.startingPlayer, destination: 'guess' }
            : { step: 'guess' }
      } else if (state.play === 'local') {
        // Shared device: cover the screen before the other player picks their secret.
        phase = { step: 'handoff', recipient: other(cmd.seat), destination: 'secret' }
      }
      return { ...state, secrets, locked, phase }
    }

    case 'SUBMIT_GUESS': {
      if (state.phase.step !== 'guess' && state.phase.step !== 'feedback') return state
      if (cmd.seat !== nextActor(state)) return state
      const opponent = other(cmd.seat)
      const secret = state.secrets[opponent]
      if (secret === null) return state
      const parsed = validateGuess(state, cmd.seat, cmd.value)
      if (!parsed.ok) return state

      let hint
      if (state.mode === 'bulls') {
        const bc = countBullsCows(String(secret), String(parsed.value))
        hint = bc.bulls === 4 ? { kind: 'correct' as const } : { kind: 'bc' as const, ...bc }
      } else {
        const guess = parsed.value as number
        hint =
          guess === (secret as number)
            ? { kind: 'correct' as const }
            : guess < (secret as number)
              ? { kind: 'higher' as const }
              : { kind: 'lower' as const }
      }

      const guesses = {
        ...state.guesses,
        [cmd.seat]: [...state.guesses[cmd.seat], { value: parsed.value, hint }],
      }
      if (hint.kind === 'correct') {
        return {
          ...state,
          guesses,
          scores: { ...state.scores, [cmd.seat]: state.scores[cmd.seat] + 1 },
          phase: { step: 'result', winner: cmd.seat },
        }
      }
      return { ...state, guesses, activePlayer: cmd.seat, phase: { step: 'feedback' } }
    }

    case 'PASS_DEVICE': {
      if (state.phase.step !== 'feedback') return state
      const next = other(state.activePlayer)
      return { ...state, activePlayer: next, phase: { step: 'handoff', recipient: next, destination: 'guess' } }
    }

    case 'VOTE_REMATCH': {
      if (state.phase.step !== 'result') return state
      if (state.rematchVotes[cmd.seat]) return state
      const votes = { ...state.rematchVotes, [cmd.seat]: true }
      if (!votes.p1 || !votes.p2) return { ...state, rematchVotes: votes }
      return {
        ...state,
        round: state.round + 1,
        startingPlayer: other(state.startingPlayer),
        activePlayer: other(state.startingPlayer),
        secrets: { p1: null, p2: null },
        locked: { p1: false, p2: false },
        guesses: { p1: [], p2: [] },
        rematchVotes: { p1: false, p2: false },
        phase:
          state.play === 'local'
            ? { step: 'handoff', recipient: 'p1', destination: 'secret' }
            : { step: 'setup' },
      }
    }
  }
}

/**
 * Player-specific projection of the session. The opponent's secret never
 * leaves this function un-revealed: it appears only inside `revealed` on result.
 */
export function selectView(s: Session, you: PlayerId): SeatView {
  const opponent = other(you)
  let step: SeatView['step']
  switch (s.phase.step) {
    case 'handoff':
      step =
        s.phase.recipient === you
          ? { screen: 'handoff', recipient: s.phase.recipient, destination: s.phase.destination }
          : { screen: 'waitingGuess', actor: s.phase.recipient }
      break
    case 'setup':
      if (!s.locked[you]) step = { screen: 'setup', entrySeat: you, bothLocked: false }
      else if (!s.locked[opponent]) step = { screen: 'setupWaiting' }
      else step = { screen: 'setupWaiting' }
      break
    case 'guess':
      step =
        s.activePlayer === you
          ? { screen: 'yourGuess' }
          : { screen: 'waitingGuess', actor: s.activePlayer }
      break
    case 'feedback':
      // The guesser reads their hint; online, the other seat may already take their turn.
      step = s.activePlayer === you ? { screen: 'feedback' } : { screen: 'yourGuess' }
      break
    case 'result':
      step = { screen: 'result', winner: s.phase.winner }
      break
  }

  return {
    mode: s.mode,
    play: s.play,
    you,
    names: s.names,
    scores: s.scores,
    round: s.round,
    startingPlayer: s.startingPlayer,
    yourSecret: s.secrets[you],
    yourSecretLocked: s.locked[you],
    yourGuesses: s.guesses[you],
    range: s.mode === 'numbers' ? remainingRangeSafe(s.guesses[you]) : null,
    step,
    revealed:
      s.phase.step === 'result'
        ? { p1: s.secrets.p1 as number | string, p2: s.secrets.p2 as number | string }
        : null,
    guessCounts:
      s.phase.step === 'result' ? { p1: s.guesses.p1.length, p2: s.guesses.p2.length } : null,
    rematchVotes: s.rematchVotes,
  }
}

function remainingRangeSafe(guesses: { value: number | string; hint: { kind: string } }[]): [number, number] {
  let lo = 0
  let hi = 100
  for (const g of guesses) {
    const v = Number(g.value)
    if (g.hint.kind === 'higher') lo = Math.max(lo, v + 1)
    if (g.hint.kind === 'lower') hi = Math.min(hi, v - 1)
  }
  return [lo, hi]
}

/** Which seat's eyes should be on a local shared screen right now. */
export function localViewSeat(s: Session): PlayerId {
  switch (s.phase.step) {
    case 'handoff':
      return s.phase.recipient
    case 'setup':
      return !s.locked.p1 ? 'p1' : 'p2'
    case 'guess':
    case 'feedback':
      return s.activePlayer
    case 'result':
      return s.startingPlayer
  }
}
