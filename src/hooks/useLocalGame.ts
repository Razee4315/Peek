import { useCallback, useState } from 'react'
import { applyCommand, createSession } from '../game/engine'
import type { Command, GameMode, Session } from '../game/types'

export function useLocalGame() {
  const [session, setSession] = useState<Session | null>(null)

  const start = useCallback((mode: GameMode, names: { p1: string; p2: string }) => {
    setSession(createSession({ mode, play: 'local', names }))
  }, [])

  const dispatch = useCallback((cmd: Command) => {
    setSession((s) => (s ? applyCommand(s, cmd) : s))
  }, [])

  const quit = useCallback(() => setSession(null), [])

  return { session, start, dispatch, quit }
}
