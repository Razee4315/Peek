import type { GameMode } from '../game/types'
import { Btn } from '../components/Btn'
import { Mascot, Wordmark } from '../components/Mascot'
import { Segmented } from '../components/Segmented'

interface HomeProps {
  mode: GameMode
  onModeChange: (m: GameMode) => void
  onLocalPlay: () => void
  onOnlinePlay: () => void
  onHowTo: () => void
  offlineReady: 'checking' | 'ready' | 'unavailable'
}

export function HomeScreen({ mode, onModeChange, onLocalPlay, onOnlinePlay, onHowTo, offlineReady }: HomeProps) {
  return (
    <div className="page">
      <div className="stack center home">
        <Wordmark height={26} />
        <Mascot size={120} className="home-mascot" />
        <div className="stack-head">
          <h1 className="title">A little guessing. A little luck.</h1>
          <p className="muted">Pick a secret. Race to find theirs first.</p>
        </div>

        <Segmented
          ariaLabel="Game mode"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'numbers', label: 'Number duel', sub: '0–100 · higher or lower' },
            { value: 'bulls', label: 'Code break', sub: '4 digits · find the code' },
          ]}
        />

        <div className="btn-col">
          <Btn onClick={onLocalPlay}>Play on this device</Btn>
          <Btn variant="secondary" onClick={onOnlinePlay}>
            Play online
          </Btn>
        </div>

        <button type="button" className="btn btn--quiet" onClick={onHowTo}>
          How to play
        </button>

        <p className="footnote">
          2 players · {mode === 'numbers' ? 'numbers 0–100' : '4-digit codes'}
          {offlineReady === 'ready' ? ' · ready for offline play' : ''}
        </p>
      </div>
    </div>
  )
}
