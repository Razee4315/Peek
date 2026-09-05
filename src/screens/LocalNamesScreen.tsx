import { useState } from 'react'
import type { GameMode } from '../game/types'
import { Btn } from '../components/Btn'
import { cleanName } from '../game/engine'

interface LocalNamesProps {
  mode: GameMode
  onStart: (names: { p1: string; p2: string }) => void
  onBack: () => void
}

export function LocalNamesScreen({ mode, onStart, onBack }: LocalNamesProps) {
  const [n1, setN1] = useState('')
  const [n2, setN2] = useState('')

  return (
    <div className="stack">
      <div className="stack-head">
        <p className="eyebrow">{mode === 'numbers' ? 'Number duel' : 'Code break'}</p>
        <h1 className="title">Who&rsquo;s playing?</h1>
        <p className="muted">Names are optional and stay on this device.</p>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p1name">
          <span className={`dot dot--p1`} aria-hidden="true" /> Player 1
        </label>
        <input
          id="p1name"
          className="field-input field-input--name"
          type="text"
          maxLength={20}
          placeholder="Maya"
          autoComplete="off"
          value={n1}
          onChange={(e) => setN1(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="p2name">
          <span className={`dot dot--p2`} aria-hidden="true" /> Player 2
        </label>
        <input
          id="p2name"
          className="field-input field-input--name"
          type="text"
          maxLength={20}
          placeholder="Sam"
          autoComplete="off"
          value={n2}
          onChange={(e) => setN2(e.target.value)}
        />
      </div>

      <div className="btn-col">
        <Btn onClick={() => onStart({ p1: cleanName(n1) ?? '', p2: cleanName(n2) ?? '' })}>
          Start
        </Btn>
        <Btn variant="quiet" onClick={onBack}>
          Back
        </Btn>
      </div>
      <p className="footnote">You&rsquo;ll take turns passing this device between picks.</p>
    </div>
  )
}
