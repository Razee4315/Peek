import { useState } from 'react'
import { DigitFeedback } from './DigitFeedback'
import type { Attempt, GameMode } from '../game/types'

function Arrow({ up }: { up: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className={up ? 'arrow-up' : 'arrow-down'}>
      <path
        d={up ? 'M8 13V3M3.5 7.5 8 3l4.5 4.5' : 'M8 3v10M3.5 8.5 8 13l4.5-4.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function hintWord(a: Attempt): string {
  if (a.hint.kind === 'higher') return 'Higher'
  if (a.hint.kind === 'lower') return 'Lower'
  if (a.hint.kind === 'digits') return `${a.hint.positions.filter(Boolean).length} of 4 digits correct`
  return 'Got it'
}

/** Expandable flat list of this player's attempts, newest first. */
export function History({ attempts, mode, label = 'Your guesses' }: { attempts: Attempt[]; mode: GameMode; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="history">
      <button type="button" className="history-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? `Hide ${label.toLowerCase()}` : `${label} (${attempts.length})`}
      </button>
      {open &&
        (attempts.length === 0 ? (
          <p className="history-empty">Your first guess starts here.</p>
        ) : (
          <ul className="history-list">
            {[...attempts].reverse().map((a, i) => {
              const key = `${a.value}-${attempts.length - i}`
              return (
                <li key={key} className="history-row">
                  {a.hint.kind === 'digits' ? <DigitFeedback attempt={a} compact /> : <span className="history-value">{a.value}</span>}
                  <span className={`history-hint${a.hint.kind === 'digits' ? ' history-hint--bc' : ''}`}>
                    {mode !== 'bulls' && a.hint.kind !== 'digits' && a.hint.kind !== 'correct' && (
                      <Arrow up={a.hint.kind === 'higher'} />
                    )}
                    {hintWord(a)}
                  </span>
                </li>
              )
            })}
          </ul>
        ))}
    </section>
  )
}
