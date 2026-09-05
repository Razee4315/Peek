import type { Attempt } from '../game/types'

export function DigitFeedback({ attempt, compact = false }: { attempt: Attempt; compact?: boolean }) {
  if (attempt.hint.kind !== 'digits') return null
  const positions = attempt.hint.positions
  return (
    <div className={`digit-feedback${compact ? ' digit-feedback--compact' : ''}`} role="list" aria-label="Guess by position">
      {String(attempt.value).split('').map((digit, index) => (
        <div key={index} role="listitem" className={`digit-result${positions[index] ? ' digit-result--correct' : ''}`}
          aria-label={`Position ${index + 1}: ${digit}, ${positions[index] ? 'Correct' : 'Not correct'}`}>
          <span className="digit-result-value" aria-hidden="true">{digit}</span>
          <span className="digit-result-label" aria-hidden="true">{positions[index] ? '✓ Correct' : '× Not correct'}</span>
        </div>
      ))}
    </div>
  )
}
