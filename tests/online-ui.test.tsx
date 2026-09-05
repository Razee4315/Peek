import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GameBoard } from '../src/components/GameBoard'
import { OnlineScreen } from '../src/screens/OnlineScreen'
import { applyCommand, createSession, selectView } from '../src/game/engine'

const actions = { onAckHandoff: vi.fn(), onLock: vi.fn(), onGuess: vi.fn(), onPass: vi.fn(), onRematch: vi.fn(), onNewGame: vi.fn() }
describe('online screen content', () => {
  it('shows the submitted opponent guess on the next player turn, for both modes', () => {
    for (const mode of ['numbers', 'bulls'] as const) {
      let s = createSession({ mode, play: 'online', names: { p1: 'Maya', p2: 'Sam' } })
      s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p1', value: mode === 'numbers' ? 76 : '0473' })
      s = applyCommand(s, { type: 'LOCK_SECRET', seat: 'p2', value: mode === 'numbers' ? 20 : '9012' })
      s = applyCommand(s, { type: 'SUBMIT_GUESS', seat: 'p1', value: mode === 'numbers' ? 50 : '3074' })
      const html = renderToStaticMarkup(<GameBoard view={selectView(s, 'p2')} {...actions} />)
      expect(html).toContain('Maya guessed')
      expect(html).toContain(mode === 'numbers' ? '50' : '3074')
      expect(html).toContain(mode === 'numbers' ? 'Lower' : '1 of 4 digits correct')
      if (mode === 'bulls') {
        expect(html).toContain('Position 2: 0, Correct')
        expect(html).toContain('Position 1: 3, Not correct')
        expect(html).not.toContain(' close')
        expect(html).not.toContain(' exact')
      }
      expect(html).not.toContain(mode === 'numbers' ? '>76<' : '>0473<')
    }
  })
  it('makes invite name entry explicit and prevents an unnamed join', () => {
    const net = { state: { st: 'lobby' as const }, hostRoom: vi.fn(), joinRoom: vi.fn(), lock: vi.fn(), guess: vi.fn(), rematch: vi.fn(), leave: vi.fn() }
    const html = renderToStaticMarkup(<OnlineScreen mode="numbers" net={net} prefillCode="ABCDE" onExit={vi.fn()} onRequestQuit={vi.fn()} />)
    expect(html).toContain('You are Player 2.')
    expect(html).toContain('Your name')
    expect(html).toContain('value="ABCDE"')
    expect(html).not.toContain('Create a room')
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Join<\/button>/)
  })
})
