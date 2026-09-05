import type { GameMode } from '../game/types'
import { Btn } from '../components/Btn'
import { Dialog } from '../components/Dialog'

interface HowToPlayProps {
  open: boolean
  mode: GameMode
  onClose: () => void
}

export function HowToPlayDialog({ open, mode, onClose }: HowToPlayProps) {
  return (
    <Dialog open={open} title="How to play" onCloseRequest={onClose}>
      <div className="howto">
        {mode === 'numbers' ? (
          <>
            <p>
              Each player secretly picks a whole number from <strong>0 to 100</strong>. Then take turns
              guessing the other player&rsquo;s number.
            </p>
            <p>
              After every guess you learn <strong>higher</strong> or <strong>lower</strong> — and your
              possible range narrows. First correct guess wins the round and scores a point.
            </p>
          </>
        ) : (
          <>
            <p>
              Each player secretly picks a code of <strong>4 different digits</strong> — zeros allowed,
              like <span className="num">0473</span>. Take turns guessing the other player&rsquo;s code.
            </p>
            <p>
              After every guess you learn how many digits are <strong>exact</strong> (right digit in the
              right spot) and how many are <strong>close</strong> (right digit, wrong spot). Four exact
              cracks the code and wins the round.
            </p>
          </>
        )}
        <p className="muted">
          Whoever guesses first has a small edge, so the first guesser alternates every round. Play on
          one device, or online in a private room with a code.
        </p>
      </div>
      <Btn onClick={onClose} full>
        Got it
      </Btn>
    </Dialog>
  )
}
