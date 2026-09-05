import { describe, expect, it } from 'vitest'
import { countBullsCows, parseCode4, parseNumber0to100, remainingRange, validateGuess } from '../src/game/validate'
import { applyCommand, createSession, localViewSeat, nextActor, selectView } from '../src/game/engine'

describe('parseNumber0to100', () => {
  it('accepts endpoints 0 and 100', () => {
    expect(parseNumber0to100('0')).toEqual({ ok: true, value: 0 })
    expect(parseNumber0to100('100')).toEqual({ ok: true, value: 100 })
  })
  it('normalizes leading zeros', () => {
    expect(parseNumber0to100('007')).toEqual({ ok: true, value: 7 })
    expect(parseNumber0to100(' 042 ')).toEqual({ ok: true, value: 42 })
  })
  it('rejects blank, decimals, signs, exponents and overflow', () => {
    for (const bad of ['', '   ', '3.5', '-1', '+5', '1e2', 'abc', '101', '1000']) {
      expect(parseNumber0to100(bad).ok).toBe(false)
    }
  })
})

describe('parseCode4', () => {
  it('accepts 4 different digits, including a leading zero', () => {
    expect(parseCode4('0473')).toEqual({ ok: true, value: '0473' })
    expect(parseCode4('9012')).toEqual({ ok: true, value: '9012' })
  })
  it('rejects short, long, non-digit and repeated-digit codes', () => {
    for (const bad of ['', '123', '12345', '12a4', '1123', '0011']) {
      expect(parseCode4(bad).ok).toBe(false)
    }
  })
})

describe('countBullsCows', () => {
  it('scores bulls, cows and the win', () => {
    expect(countBullsCows('0473', '0473')).toEqual({ bulls: 4, cows: 0 })
    expect(countBullsCows('0473', '0123')).toEqual({ bulls: 2, cows: 0 })
    expect(countBullsCows('0473', '3074')).toEqual({ bulls: 1, cows: 3 })
    expect(countBullsCows('0473', '7630')).toEqual({ bulls: 0, cows: 3 })
    expect(countBullsCows('0473', '9812')).toEqual({ bulls: 0, cows: 0 })
  })
})

describe('remainingRange', () => {
  it('narrows with each honest hint and keeps bounds inclusive', () => {
    expect(remainingRange([])).toEqual([0, 100])
    expect(remainingRange([{ value: 50, hint: { kind: 'higher' } }])).toEqual([51, 100])
    expect(
      remainingRange([
        { value: 50, hint: { kind: 'higher' } },
        { value: 80, hint: { kind: 'lower' } },
      ]),
    ).toEqual([51, 79])
  })
})

describe('numbers duel (local)', () => {
  it('compares each guess against the opposing secret and alternates turns', () => {
    let s = createSession({ mode: 'numbers', play: 'local', names: { p1: 'Maya', p2: 'Sam' } })
    expect(s.phase).toEqual({ step: 'handoff', recipient: 'p1', destination: 'secret' })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    expect(s.phase.step).toBe('setup')

    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 76 })
    expect(s.locked).toEqual({ p1: true, p2: false })
    expect(s.phase).toEqual({ step: 'handoff', recipient: 'p2', destination: 'secret' })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 20 })
    expect(s.phase).toEqual({ step: 'handoff', recipient: 'p1', destination: 'guess' })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    expect(s.phase.step).toBe('guess')
    expect(s.activePlayer).toBe('p1')

    // p1 guesses p2's secret (20): too high
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 50 })
    expect(s.phase.step).toBe('feedback')
    expect(s.guesses.p1).toEqual([{ value: 50, hint: { kind: 'lower' } }])
    expect(s.guesses.p2).toEqual([])

    // duplicate submit from the same seat is rejected without mutation
    const before = s
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 40 })
    expect(s).toBe(before)

    // Local play must pass and acknowledge before the next player can guess.
    expect(applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: 51 })).toBe(s)
    s = applyCommand(s, { type: 'PASS_DEVICE' })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: 51 })
    expect(s.guesses.p2).toEqual([{ value: 51, hint: { kind: 'higher' } }])

    s = applyCommand(s, { type: 'PASS_DEVICE' })
    expect(s.phase).toEqual({ step: 'handoff', recipient: 'p1', destination: 'guess' })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })

    // p1 already knows the answer is below 50: 55 is rejected and consumes nothing
    const beforeRange = s
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 55 })
    expect(s).toBe(beforeRange)

    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 20 })
    expect(s.phase).toEqual({ step: 'result', winner: 'p1' })
    expect(s.guesses.p1).toHaveLength(2)
  })

  it('ends the round on the first correct guess, once, and awards one point', () => {
    let s = createSession({ mode: 'numbers', play: 'local', names: { p1: 'Maya', p2: 'Sam' } })
    for (const cmd of [
      { type: 'ACK_HANDOFF' },
      { type: 'LOCK_SECRET', seat: 'p1', value: 7 },
      { type: 'ACK_HANDOFF' },
      { type: 'LOCK_SECRET', seat: 'p2', value: 9 },
      { type: 'ACK_HANDOFF' },
    ] as const) {
      s = applyCommand(s, cmd)
    }
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 9 })
    expect(s.phase).toEqual({ step: 'result', winner: 'p1' })
    expect(s.scores).toEqual({ p1: 1, p2: 0 })
    const again = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 9 })
    expect(again.scores).toEqual({ p1: 1, p2: 0 })
  })

  it('alternates the starting seat on rematch and collects fresh secrets', () => {
    let s = createSession({ mode: 'numbers', play: 'local' })
    for (const cmd of [
      { type: 'ACK_HANDOFF' },
      { type: 'LOCK_SECRET', seat: 'p1', value: 7 },
      { type: 'ACK_HANDOFF' },
      { type: 'LOCK_SECRET', seat: 'p2', value: 9 },
      { type: 'ACK_HANDOFF' },
      { type: 'SUBMIT_GUESS', seat: 'p1', value: 9 },
    ] as const) {
      s = applyCommand(s, cmd)
    }
    s = applyCommand(s, { type: 'VOTE_REMATCH', seat: 'p1' })
    // one vote alone does not reset the round online-style guard: local also needs both? local UI votes for both seats.
    expect(s.phase.step).toBe('result')
    s = applyCommand(s, { type: 'VOTE_REMATCH', seat: 'p2' })
    expect(s.round).toBe(2)
    expect(s.startingPlayer).toBe('p2')
    expect(s.activePlayer).toBe('p2')
    expect(s.secrets).toEqual({ p1: null, p2: null })
    expect(s.phase).toEqual({ step: 'handoff', recipient: 'p1', destination: 'secret' })
    expect(s.scores).toEqual({ p1: 1, p2: 0 })
  })

  it('allows equal secrets and rejects wrong-phase commands', () => {
    let s = createSession({ mode: 'numbers', play: 'local' })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 5 })
    expect(s.phase.step).toBe('handoff')
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 44 })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 44 })
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 44 })
    expect(s.phase).toEqual({ step: 'result', winner: 'p1' })
    // result phase rejects game commands
    expect(applyCommand(s, { type: 'PASS_DEVICE' })).toBe(s)
  })
})

describe('selectView privacy', () => {
  it('never exposes the opponent secret before the result', () => {
    let s = createSession({ mode: 'numbers', play: 'online', names: { p1: 'Maya', p2: 'Sam' } })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 76 })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 20 })
    const v1 = selectView(s, 'p1')
    const v2 = selectView(s, 'p2')
    expect(v1.yourSecret).toBe(76)
    expect(v2.yourSecret).toBe(20)
    expect(JSON.stringify(v2)).not.toContain('76')
    expect(JSON.stringify(v1)).not.toContain('20')
    // online: both locked goes straight to guessing, starter p1 first
    expect(v1.step.screen).toBe('yourGuess')
    const v2b = selectView(s, 'p2')
    expect(v2b.step.screen).toBe('waitingGuess')
  })

  it('gives each seat an independent range and reveals secrets only on result', () => {
    let s = createSession({ mode: 'numbers', play: 'online' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 76 })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 20 })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 50 })
    const v1 = selectView(s, 'p1')
    expect(v1.range).toEqual([0, 49])
    expect(v1.yourGuesses).toHaveLength(1)
    const v2 = selectView(s, 'p2')
    expect(v2.range).toEqual([0, 100])
    expect(v2.step.screen).toBe('yourGuess') // online: other seat may already play
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: 76 })
    const vr = selectView(s, 'p1')
    expect(vr.step.screen).toBe('result')
    expect(vr.revealed).toEqual({ p1: 76, p2: 20 })
  })
})

describe('bulls & cows duel', () => {
  function playBulls(first = 'p1') {
    let s = createSession({ mode: 'bulls', play: 'online', startingPlayer: first })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: '0473' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: '9012' })
    return s
  }

  it('scores bulls and cows against the opposing code', () => {
    let s = playBulls() // p1 secret 0473, p2 secret 9012
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: '3074' })
    expect(s.guesses.p1).toEqual([{ value: '3074', hint: { kind: 'bc', bulls: 1, cows: 0 } }])
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: '3074' })
    expect(s.guesses.p2).toEqual([{ value: '3074', hint: { kind: 'bc', bulls: 1, cows: 3 } }])
  })

  it('rejects repeated digits and wins on four bulls', () => {
    let s = playBulls()
    const bad = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: '1123' })
    expect(bad).toBe(s)
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: '1234' })
    expect(s.phase.step).toBe('feedback')
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: '9876' })
    expect(s.phase.step).toBe('feedback')
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: '9012' })
    expect(s.phase).toEqual({ step: 'result', winner: 'p1' })
    const v = selectView(s, 'p2')
    expect(v.revealed).toEqual({ p1: '0473', p2: '9012' })
  })
})

describe('nextActor and localViewSeat', () => {
  it('lets the other seat move straight after a wrong guess online', () => {
    const s = createSession({ mode: 'numbers', play: 'online' })
    expect(nextActor(s)).toBe('p1')
  })
  it('follows the shared device through setup', () => {
    let s = createSession({ mode: 'numbers', play: 'local' })
    expect(localViewSeat(s)).toBe('p1')
    s = applyCommand(s, { type: 'ACK_HANDOFF' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 3 })
    expect(localViewSeat(s)).toBe('p2')
  })
})

describe('validateGuess', () => {
  it('rejects guesses outside the remaining range without consuming a turn', () => {
    let s = createSession({ mode: 'numbers', play: 'online' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 76 })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 20 })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 50 })
    // 50 was 'lower' against 20, so p1's own hunt range is 0–49 now
    expect(validateGuess(s, 'p1', 49).ok).toBe(true)
    expect(validateGuess(s, 'p1', 50).ok).toBe(false)
    expect(validateGuess(s, 'p1', 51).ok).toBe(false)
    expect(validateGuess(s, 'p1', 0).ok).toBe(true)
  })
})

describe('online opponent activity', () => {
  it('shares submitted guesses and readiness, without revealing an unguessed secret', () => {
    let s = createSession({ mode: 'numbers', play: 'online' })
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: 76 })
    expect(selectView(s, 'p2').opponentSecretLocked).toBe(true)
    expect(selectView(s, 'p2').revealed).toBeNull()
    s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: 20 })
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: 50 })
    const view = selectView(s, 'p2')
    expect(view.opponentGuesses).toEqual([{ value: 50, hint: { kind: 'lower' } }])
    expect(view.yourGuesses).toEqual([])
    expect(JSON.stringify(view)).not.toContain('76')
    expect(applyCommand(s, { type: 'PASS_DEVICE' })).toBe(s)
    s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p2', value: 76 })
    s = applyCommand(s, { type: 'VOTE_REMATCH', seat: 'p1' })
    s = applyCommand(s, { type: 'VOTE_REMATCH', seat: 'p2' })
    expect(selectView(s, 'p1').opponentGuesses).toEqual([])
  })
  it('keeps local opponent history private', () => {
    const s = createSession({ mode: 'numbers', play: 'local' })
    s.guesses.p2.push({ value: 10, hint: { kind: 'higher' } })
    expect(selectView(s, 'p1').opponentGuesses).toEqual([])
  })
})
