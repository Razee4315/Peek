import { useEffect, useRef, useState } from 'react'
import { parseNumber0to100, rangeError, validateSecret } from '../game/validate'
import type { PlayerId, SeatView, SecretValue } from '../game/types'
import { other } from '../game/types'
import { Btn } from './Btn'
import { History, hintWord } from './History'
import { DigitFeedback } from './DigitFeedback'
import { Mascot } from './Mascot'
import { NumField } from './NumField'
import { HandoffCover } from './TopBar'

function ArrowHero({ up }: { up: boolean }) {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true" className={up ? 'arrow-up' : 'arrow-down'}>
      <path
        d={up ? 'M12 20V4M5 11l7-7 7 7' : 'M12 4v16M5 13l7 7 7-7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function useHeadingFocus(dep: string) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [dep])
  return ref
}

interface GameBoardProps {
  view: SeatView
  onAckHandoff: () => void
  onLock: (value: SecretValue) => void
  onGuess: (value: SecretValue) => void
  onPass: () => void
  onRematch: () => void
  onNewGame: () => void
}

export function GameBoard(props: GameBoardProps) {
  const { view } = props
  switch (view.step.screen) {
    case 'handoff':
      return (
        <HandoffCover
          recipient={view.step.recipient}
          name={view.names[view.step.recipient]}
          destination={view.step.destination}
          onReady={props.onAckHandoff}
        />
      )
    case 'setup':
      return <SecretEntry key={view.step.entrySeat} view={view} onLock={props.onLock} />
    case 'setupWaiting':
      return <SetupWaiting view={view} />
    case 'yourGuess':
      return <TurnEntry view={view} onGuess={props.onGuess} />
    case 'waitingGuess':
      return <WaitingTurn view={view} />
    case 'feedback':
      return <Feedback view={view} onPass={props.onPass} />
    case 'result':
      return <Result view={view} onRematch={props.onRematch} onNewGame={props.onNewGame} />
  }
}

function SecretEntry({ view, onLock }: { view: SeatView; onLock: (v: SecretValue) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | undefined>()
  const head = useHeadingFocus('setup')
  const you = view.you

  const submit = () => {
    const parsed = validateSecret(view.mode, text)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    onLock(parsed.value)
  }

  return (
    <div className="stack">
      <div className="stack-head">
        <p className="eyebrow">
          <span className={`dot dot--${you}`} aria-hidden="true" />
          {you === 'p1' ? 'Player 1' : 'Player 2'}
        </p>
        <h1 tabIndex={-1} ref={head} className="title">
          Your secret, {view.names[you]}.
        </h1>
        <p className="muted">
          {view.mode === 'numbers'
            ? 'Choose a whole number from 0 to 100.'
            : 'Pick a code of 4 different digits.'}
        </p>
      </div>
      {view.play === 'online' && <p className="muted" role="status">{view.names[other(you)]}{view.opponentSecretLocked ? " has locked their secret." : " is choosing their secret."}</p>}
      <div className="secret-field">
        <NumField
          label={view.mode === 'numbers' ? 'Your number' : 'Your code'}
          value={text}
          onChange={(v) => {
            setText(v)
            setError(undefined)
          }}
          onSubmit={submit}
          maxLength={view.mode === 'numbers' ? 3 : 4}
          wide={view.mode === 'bulls'}
          masked
          autoFocus
          error={error}
          helper="Keep it to yourself."
        />
      </div>
      <Btn onClick={submit} disabled={text === ''}>
        Lock my number
      </Btn>
    </div>
  )
}

function SetupWaiting({ view }: { view: SeatView }) {
  const opponent = other(view.you)
  return (
    <div className="stack center">
      <Mascot size={80} />
      <h1 className="title">Secret locked.</h1>
      <p className="muted">Waiting for {view.names[opponent]} to pick theirs…</p>
    </div>
  )
}

function TurnEntry({ view, onGuess }: { view: SeatView; onGuess: (v: SecretValue) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | undefined>()
  const head = useHeadingFocus('yourGuess')
  const opponent = other(view.you)
  const isBulls = view.mode === 'bulls'

  const submit = () => {
    if (isBulls) {
      const parsed = validateSecret('bulls', text)
      if (!parsed.ok) return setError(parsed.error)
      setError(undefined)
      setText('')
      onGuess(parsed.value)
      return
    }
    const parsed = parseNumber0to100(text)
    if (!parsed.ok) return setError(parsed.error)
    const range = view.range ?? [0, 100]
    const n = parsed.value as number
    if (n < range[0] || n > range[1]) return setError(rangeError(range as [number, number]))
    setError(undefined)
    setText('')
    onGuess(n)
  }

  return (
    <div className="stack">
      <div className="stack-head">
        <p className="eyebrow">
          <span className={`dot dot--${view.you}`} aria-hidden="true" />
          {view.names[view.you]}&rsquo;s turn · {view.you === 'p1' ? 'Player 1' : 'Player 2'}
        </p>
        <h1 tabIndex={-1} ref={head} className="title">
          {isBulls ? `Crack ${view.names[opponent]}’s code.` : `What’s ${view.names[opponent]}’s number?`}
        </h1>
      </div>
      <NumField
        label={isBulls ? 'Your guess' : 'Your guess'}
        value={text}
        onChange={(v) => {
          setText(v)
          setError(undefined)
        }}
        onSubmit={submit}
        maxLength={isBulls ? 4 : 3}
        wide={isBulls}
        error={error}
        helper={
          isBulls
            ? 'Four different digits.'
            : view.range
              ? `Possible range: ${view.range[0]}–${view.range[1]}`
              : 'From 0 to 100.'
        }
      />
      <Btn onClick={submit} disabled={text === ''}>
        Make guess
      </Btn>
      <OpponentActivity view={view} />
      <History attempts={view.yourGuesses} mode={view.mode} />
    </div>
  )
}

function WaitingTurn({ view }: { view: SeatView }) {
  const actor = view.step.screen === 'waitingGuess' ? view.step.actor : other(view.you)
  return (
    <div className="stack center">
      <Mascot size={80} />
      <h1 className="title">Waiting for {view.names[actor]}…</h1>
      <p className="muted">Their guess is on the way.</p>
      <OpponentActivity view={view} />
      <History attempts={view.yourGuesses} mode={view.mode} />
    </div>
  )
}

function Feedback({ view, onPass }: { view: SeatView; onPass: () => void }) {
  const head = useHeadingFocus('feedback')
  const opponent = other(view.you)
  const last = view.yourGuesses[view.yourGuesses.length - 1]
  const live = useRef<HTMLDivElement>(null)

  if (!last) return null
  return (
    <div className="stack">
      <div className="stack-head">
        <p className="eyebrow">
          <span className={`dot dot--${view.you}`} aria-hidden="true" />
          {view.names[view.you]}&rsquo;s guess
        </p>
        <div ref={live} aria-live="polite" className="feedback-hero">
          {last.hint.kind === 'digits' ? (
            <>
              <h1 tabIndex={-1} ref={head} className="title feedback-word">
                {hintWord(last)}
              </h1>
              <DigitFeedback attempt={last} />
              <p className="muted">
                Correct means the digit matches this position. Try a different digit wherever it says Not correct.
              </p>
            </>
          ) : (
            <>
              <ArrowHero up={last.hint.kind === 'higher'} />
              <h1 tabIndex={-1} ref={head} className="title feedback-word">
                {last.hint.kind === 'higher' ? 'Higher' : 'Lower'}
              </h1>
              <p className="muted">
                Their number is {last.hint.kind === 'higher' ? 'above' : 'below'}{' '}
                <span className="num">{last.value}</span>.
              </p>
            </>
          )}
        </div>
        {view.range && (
          <p className="range-note">
            Possible range: {view.range[0]}–{view.range[1]}
          </p>
        )}
      </div>
      {view.play === 'local' ? (
        <Btn onClick={onPass}>Pass to {view.names[opponent]}</Btn>
      ) : (
        <p className="muted center-text">Turn passes to {view.names[opponent]}.</p>
      )}
      <OpponentActivity view={view} />
      <History attempts={view.yourGuesses} mode={view.mode} />
    </div>
  )
}

function Result({
  view,
  onRematch,
  onNewGame,
}: {
  view: SeatView
  onRematch: () => void
  onNewGame: () => void
}) {
  const head = useHeadingFocus('result')
  const winner = view.step.screen === 'result' ? view.step.winner : view.startingPlayer
  const iVoted = view.rematchVotes[view.you]
  const theyVoted = view.rematchVotes[other(view.you)]
  const counts = view.guessCounts ?? { p1: 0, p2: 0 }
  const nextStarter = other(view.startingPlayer)

  return (
    <div className="stack center">
      <Mascot size={88} />
      <h1 tabIndex={-1} ref={head} className="title">
        {view.mode === 'bulls' ? `${view.names[winner]} cracked it!` : `${view.names[winner]} found it!`}
      </h1>

      <div className="reveal">
        {(['p1', 'p2'] as PlayerId[]).map((p) => (
          <div key={p} className="reveal-row">
            <span className={`dot dot--${p}`} aria-hidden="true" />
            <span className="reveal-name">
              {view.names[p]}
              <span className="reveal-sub">
                {p === winner ? 'winner · ' : ''}
                {counts[p]} {counts[p] === 1 ? 'try' : 'tries'}
              </span>
            </span>
            <span className="reveal-value num">{view.revealed?.[p]}</span>
          </div>
        ))}
      </div>

      <p className="scoreline">
        {view.names.p1} {view.scores.p1} · {view.scores.p2} {view.names.p2}
        <span className="score-sub">
          Round {view.round} · {view.names[nextStarter]} guesses first next round
        </span>
      </p>

      {view.play === 'online' && iVoted && !theyVoted && (
        <p className="muted" aria-live="polite">
          Waiting for {view.names[other(view.you)]} to accept a rematch…
        </p>
      )}

      <div className="btn-col">
        <Btn onClick={onRematch} disabled={view.play === 'online' && iVoted && !theyVoted}>
          Play again
        </Btn>
        <Btn variant="secondary" onClick={onNewGame}>
          New game
        </Btn>
      </div>
    </div>
  )
}

function OpponentActivity({ view }: { view: SeatView }) {
  if (view.play !== 'online') return null
  const attempts = view.opponentGuesses ?? []
  const last = attempts[attempts.length - 1]
  if (!last) return null
  const name = view.names[other(view.you)]
  return (
    <section className="opponent-activity" aria-label="Opponent activity">
      <p role="status"><strong>{name} guessed <span className="num">{last.value}</span>.</strong> {hintWord(last)}</p>
      {last.hint.kind === 'digits' && <DigitFeedback attempt={last} compact />}
      <History attempts={attempts} mode={view.mode} label={name + "'s guesses"} />
    </section>
  )
}
