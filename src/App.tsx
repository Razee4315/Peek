import { useCallback, useEffect, useState } from 'react'
import type { GameMode } from './game/types'
import { localViewSeat, selectView } from './game/engine'
import { useLocalGame } from './hooks/useLocalGame'
import { useOnlineGame } from './hooks/useOnlineGame'
import { useOfflineReady } from './hooks/useOfflineReady'
import { Btn } from './components/Btn'
import { Dialog } from './components/Dialog'
import { GameBoard } from './components/GameBoard'
import { TopBar, WelcomeBackCover } from './components/TopBar'
import { HomeScreen } from './screens/HomeScreen'
import { HowToPlayDialog } from './screens/HowToPlayDialog'
import { LocalNamesScreen } from './screens/LocalNamesScreen'
import { OnlineScreen } from './screens/OnlineScreen'
import { normalizeRoomCode } from './net/protocol'

type Route = { r: 'home' } | { r: 'localNames' } | { r: 'localGame' } | { r: 'online' }

export default function App() {
  const [mode, setMode] = useState<GameMode>('numbers')
  const [route, setRoute] = useState<Route>(() => ({ r: new URLSearchParams(window.location.search).has('room') ? 'online' : 'home' }))
  const [howToOpen, setHowToOpen] = useState(false)
  const [quitOpen, setQuitOpen] = useState(false)
  const [covered, setCovered] = useState(false)

  const local = useLocalGame()
  const net = useOnlineGame()
  const offlineReady = useOfflineReady()

  const [roomParam] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    return normalizeRoomCode(q.get('room') ?? '')
  })

  const onlineLive =
    route.r === 'online' &&
    (net.state.st === 'live' || net.state.st === 'hosting' || net.state.st === 'creating' || net.state.st === 'joining')
  const inGame = route.r === 'localGame' || onlineLive

  // Privacy cover: hide any live round the moment the page loses focus.
  useEffect(() => {
    if (!inGame) return
    const cover = () => setCovered(true)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cover()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', cover)
    return () => {
      window.removeEventListener('blur', cover)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [inGame])

  // Browser Back during a round opens the quit confirmation instead of leaving.
  useEffect(() => {
    if (!inGame) return
    window.history.pushState({ peek: 'game' }, '')
    const onPop = () => {
      setQuitOpen(true)
      window.history.pushState({ peek: 'game' }, '')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [inGame])

  const goHome = useCallback(() => {
    setQuitOpen(false)
    setCovered(false)
    setRoute({ r: 'home' })
  }, [])

  const performQuit = useCallback(() => {
    if (route.r === 'online') net.leave()
    if (route.r === 'localGame') local.quit()
    goHome()
  }, [goHome, local, net, route.r])

  const quitDialog = (
    <Dialog open={quitOpen} title="End this game?" onCloseRequest={() => setQuitOpen(false)}>
      <p className="muted dialog-body">
        The round, secrets and score live only in memory, ending the game clears them.
      </p>
      <div className="btn-col">
        <Btn onClick={() => setQuitOpen(false)}>Keep playing</Btn>
        <Btn variant="secondary" onClick={performQuit}>
          End game
        </Btn>
      </div>
    </Dialog>
  )

  let content: React.ReactNode
  if (route.r === 'home') {
    content = (
      <HomeScreen
        mode={mode}
        onModeChange={setMode}
        onLocalPlay={() => setRoute({ r: 'localNames' })}
        onOnlinePlay={() => setRoute({ r: 'online' })}
        onHowTo={() => setHowToOpen(true)}
        offlineReady={offlineReady}
      />
    )
  } else if (route.r === 'localNames') {
    content = (
      <div className="page">
        <LocalNamesScreen
          mode={mode}
          onBack={() => setRoute({ r: 'home' })}
          onStart={(names) => {
            local.start(mode, names)
            setRoute({ r: 'localGame' })
          }}
        />
      </div>
    )
  } else if (route.r === 'localGame' && local.session) {
    const seat = localViewSeat(local.session)
    const view = selectView(local.session, seat)
    content = (
      <div className="page">
        <TopBar onQuit={() => setQuitOpen(true)} />
        <GameBoard
          view={view}
          onAckHandoff={() => local.dispatch({ type: 'ACK_HANDOFF' })}
          onLock={(value) => local.dispatch({ type: 'LOCK_SECRET', seat, value })}
          onGuess={(value) => local.dispatch({ type: 'SUBMIT_GUESS', seat, value })}
          onPass={() => local.dispatch({ type: 'PASS_DEVICE' })}
          onRematch={() => {
            local.dispatch({ type: 'VOTE_REMATCH', seat: 'p1' })
            local.dispatch({ type: 'VOTE_REMATCH', seat: 'p2' })
          }}
          onNewGame={() => { local.quit(); goHome() }}
        />
      </div>
    )
  } else if (route.r === 'online') {
    content = (
      <OnlineScreen
        mode={mode}
        net={net}
        prefillCode={roomParam || undefined}
        onExit={goHome}
        onRequestQuit={() => setQuitOpen(true)}
      />
    )
  } else {
    content = <HomeScreen
      mode={mode}
      onModeChange={setMode}
      onLocalPlay={() => setRoute({ r: 'localNames' })}
      onOnlinePlay={() => setRoute({ r: 'online' })}
      onHowTo={() => setHowToOpen(true)}
      offlineReady={offlineReady}
    />
  }

  return (
    <main className="app">
      {content}
      {inGame && covered && <WelcomeBackCover onBack={() => setCovered(false)} />}
      <HowToPlayDialog open={howToOpen} mode={mode} onClose={() => setHowToOpen(false)} />
      {quitDialog}
    </main>
  )
}
