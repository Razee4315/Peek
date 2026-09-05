import type { PlayerId } from '../game/types'
import { Btn } from './Btn'
import { Mascot } from './Mascot'

interface TopBarProps {
  onQuit: () => void
}

export function TopBar({ onQuit }: TopBarProps) {
  return (
    <header className="topbar">
      <Mascot size={28} mark />
      <button type="button" className="btn btn--quiet btn--small" onClick={onQuit}>
        Quit
      </button>
    </header>
  )
}

interface HandoffCoverProps {
  recipient: PlayerId
  name: string
  destination: 'secret' | 'guess'
  onReady: () => void
}

/** Opaque full-screen privacy cover between two people sharing a device. */
export function HandoffCover({ recipient, name, destination, onReady }: HandoffCoverProps) {
  return (
    <div className="handoff" role="dialog" aria-modal="true" aria-label={`Pass to ${name}`}>
      <div className="handoff-inner">
        <Mascot size={72} />
        <p className="seat-chip">
          <span className={`dot dot--${recipient}`} aria-hidden="true" />
          {recipient === 'p1' ? 'Player 1' : 'Player 2'}
        </p>
        <h1 className="handoff-title">Pass to {name}.</h1>
        <p className="handoff-body">Only {name} should look next.</p>
        <Btn onClick={onReady}>I&rsquo;m {name} — {destination === 'secret' ? 'pick my secret' : 'ready'}</Btn>
      </div>
    </div>
  )
}

/** Cover shown when the tab regains focus so private content is never exposed. */
export function WelcomeBackCover({ onBack }: { onBack: () => void }) {
  return (
    <div className="handoff" role="dialog" aria-modal="true" aria-label="Welcome back">
      <div className="handoff-inner">
        <Mascot size={72} />
        <h1 className="handoff-title">Welcome back.</h1>
        <p className="handoff-body">Tap to take another peek — the round is waiting.</p>
        <Btn onClick={onBack}>Continue</Btn>
      </div>
    </div>
  )
}
