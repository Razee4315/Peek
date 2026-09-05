import type { GameMode, SecretValue, Session } from './types'

export type ParseResult =
  | { ok: true; value: SecretValue }
  | { ok: false; error: string }

/** Whole numbers 0–100 inclusive. Leading zeros normalize: '007' → 7. Zero is valid; blank is not. */
export function parseNumber0to100(raw: string): ParseResult {
  const text = raw.trim()
  if (text === '') return { ok: false, error: 'Enter a number first.' }
  if (!/^\d{1,3}$/.test(text)) return { ok: false, error: 'Whole numbers from 0 to 100 only.' }
  const value = Number(text)
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    return { ok: false, error: 'Whole numbers from 0 to 100 only.' }
  }
  return { ok: true, value }
}

/** 4 digits, all different. A leading zero is fine — it is a code, not a quantity. */
export function parseCode4(raw: string): ParseResult {
  const text = raw.trim()
  if (text === '') return { ok: false, error: 'Enter 4 digits.' }
  if (!/^\d{4}$/.test(text)) return { ok: false, error: 'Enter exactly 4 digits.' }
  if (new Set(text).size !== 4) return { ok: false, error: 'Digits must all be different.' }
  return { ok: true, value: text }
}

export function validateSecret(mode: GameMode, raw: string): ParseResult {
  return mode === 'numbers' ? parseNumber0to100(raw) : parseCode4(raw)
}

export function countBullsCows(secret: string, guess: string): { bulls: number; cows: number } {
  let bulls = 0
  let cows = 0
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) bulls++
    else if (secret.includes(guess[i])) cows++
  }
  return { bulls, cows }
}

/** Inclusive bounds still possible for a hunter, derived from their own attempts. */
export function remainingRange(guesses: { value: SecretValue; hint: { kind: string } }[]): [number, number] {
  let lo = 0
  let hi = 100
  for (const g of guesses) {
    const v = Number(g.value)
    if (g.hint.kind === 'higher') lo = Math.max(lo, v + 1)
    if (g.hint.kind === 'lower') hi = Math.min(hi, v - 1)
  }
  return [lo, hi]
}

export function rangeError(guess: number, range: [number, number]): string {
  const [lo, hi] = range
  if (lo === hi) return `It has to be ${lo} — the only number left.`
  return `Not in your range. You know it is between ${lo} and ${hi}.`
}

/** Guess validation against the live round state. Invalid guesses never consume a turn. */
export function validateGuess(session: Session, seat: 'p1' | 'p2', value: SecretValue): ParseResult {
  const opponent = seat === 'p1' ? 'p2' : 'p1'
  if (session.mode === 'bulls') {
    if (typeof value !== 'string' || !/^\d{4}$/.test(value) || new Set(value).size !== 4) {
      return { ok: false, error: 'Enter 4 different digits.' }
    }
    return { ok: true, value }
  }
  const parsed = parseNumber0to100(String(value))
  if (!parsed.ok) return parsed
  const range = remainingRange(session.guesses[seat])
  const n = parsed.value as number
  if (n < range[0] || n > range[1]) {
    return { ok: false, error: rangeError(n, range) }
  }
  return { ok: true, value: n }
}
