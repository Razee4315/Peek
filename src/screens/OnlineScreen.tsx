import { useEffect, useState } from 'react'
import type { GameMode, SeatView } from '../game/types'
import type { useOnlineGame } from '../hooks/useOnlineGame'
import { Btn } from '../components/Btn'
import { GameBoard } from '../components/GameBoard'
import { Mascot } from '../components/Mascot'
import { normalizeRoomCode } from '../net/protocol'
import { TopBar } from '../components/TopBar'

type Net = ReturnType<typeof useOnlineGame>

interface OnlineScreenProps {
  mode: GameMode
  net: Net
  prefillCode?: string
  onExit: () => void
  onRequestQuit: () => void
}

export function OnlineScreen({ mode, net, prefillCode, onExit, onRequestQuit }: OnlineScreenProps) {
  const { state } = net

  if (state.st === 'live') {
    return (
      <div className="page">
        <TopBar onQuit={onRequestQuit} />
        <GameBoard
          view={state.view}
          onAckHandoff={() => undefined}
          onLock={net.lock}
          onGuess={net.guess}
          onPass={() => undefined}
          onRematch={net.rematch}
          onNewGame={() => {
            net.leave()
            onExit()
          }}
        />
      </div>
    )
  }

  if (state.st === 'opponentLeft') {
    const name = state.view ? state.view.names[state.view.you === 'p1' ? 'p2' : 'p1'] : 'Your friend'
    return (
      <div className="page">
        <div className="stack center">
          <Mascot size={80} />
          <h1 className="title">{name} left the room.</h1>
          <p className="muted">The connection closed, so this round is over.</p>
          <Btn onClick={onExit}>Back to start</Btn>
        </div>
      </div>
    )
  }

  if (state.st === 'hosting') return <RoomWait code={state.code} onExit={onExit} />
  if (state.st === 'creating') {
    return (
      <div className="page">
        <CenterNote mascot title="Making your room…" sub="Finding a free code." />
      </div>
    )
  }
  if (state.st === 'joining') {
    return (
      <div className="page">
        <CenterNote mascot title={`Connecting to ${state.code}…`} sub="Knocking on their door." />
      </div>
    )
  }
  if (state.st === 'error') {
    return (
      <div className="page">
        <div className="stack center">
          <h1 className="title">Connection trouble</h1>
          <p className="muted">{state.message}</p>
          <Btn onClick={onExit}>Back</Btn>
        </div>
      </div>
    )
  }

  return <Lobby net={net} mode={mode} prefillCode={prefillCode} onExit={onExit} />
}

function CenterNote({
  title,
  sub,
  mascot,
}: {
  title: string
  sub: string
  mascot?: boolean
}) {
  return (
    <div className="stack center">
      {mascot && <Mascot size={80} />}
      <h1 className="title">{title}</h1>
      <p className="muted">{sub}</p>
    </div>
  )
}

function Lobby({ net, mode, prefillCode, onExit }: { net: Net; mode: GameMode; prefillCode?: string; onExit: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState(prefillCode ?? '')

  return (
    <div className="page">
      <div className="stack">
        <div className="stack-head">
          <p className="eyebrow">{mode === 'numbers' ? 'Number duel' : 'Code break'} · online</p>
          <h1 className="title">Play a friend, anywhere.</h1>
          <p className="muted">One of you opens a room; the other joins with the code.</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="oname">
            Your name
          </label>
          <input
            id="oname"
            className="field-input field-input--name"
            type="text"
            maxLength={20}
            placeholder="Maya"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="btn-col">
          <Btn onClick={() => net.hostRoom(mode, name)}>Create a room</Btn>
        </div>

        <div className="divider" role="separator">
          <span>or join one</span>
        </div>

        <div className="join-row">
          <input
            className="field-input field-input--code join-code"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label="Room code"
            placeholder="CODE"
            maxLength={5}
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && code.length >= 4) net.joinRoom(code, name)
            }}
          />
          <Btn onClick={() => net.joinRoom(code, name)} disabled={code.length < 4}>
            Join
          </Btn>
        </div>

        <Btn variant="quiet" onClick={onExit}>
          Back
        </Btn>
      </div>
    </div>
  )
}

function RoomWait({ code, onExit }: { code: string; onExit: () => void }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(null), 2000)
    return () => window.clearTimeout(t)
  }, [copied])

  const copy = async (what: 'code' | 'link') => {
    const text = what === 'code' ? code : `${location.origin}${location.pathname}?room=${code}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div className="page">
      <div className="stack center">
        <Mascot size={88} />
        <p className="eyebrow">Room open</p>
        <h1 className="title">Invite your friend.</h1>
        <p className="room-code" aria-label={`Room code ${code.split('').join(' ')}`}>
          {code}
        </p>
        <p className="muted">Share the code — or the link — and the duel starts when they arrive.</p>
        <div className="btn-col">
          <Btn variant="secondary" onClick={() => copy('code')}>
            {copied === 'code' ? 'Copied!' : 'Copy code'}
          </Btn>
          <Btn variant="secondary" onClick={() => copy('link')}>
            {copied === 'link' ? 'Copied!' : 'Copy invite link'}
          </Btn>
        </div>
        <p className="muted" aria-live="polite">
          Waiting for your friend…
        </p>
        <Btn variant="quiet" onClick={onExit}>
          Cancel
        </Btn>
      </div>
    </div>
  )
}

export type { SeatView }
