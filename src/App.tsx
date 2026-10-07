import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Board } from './components/Board'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DrawArea } from './components/DrawArea'
import { ResultModal } from './components/ResultModal'
import { ScoreBoard } from './components/ScoreBoard'
import { appReducer, hasProgress, type AppState } from './game/appState'
import {
  MATCH_DELAY_MS,
  MIDDLE_BONUS,
  findMatch,
  newGame,
  scoreOf,
  status,
  type Game,
  type Source,
} from './game/rules'
import { playSound } from './game/sound'
import { isGoodResult } from './game/stats'
import { browserStore, loadGame, loadMuted, loadStats, saveGame, saveMuted, saveStats } from './game/storage'
import './App.css'

const store = browserStore()

function init(): AppState {
  return { game: loadGame(store) ?? newGame(), stats: loadStats(store) }
}

function statusMessage(game: Game, hint: [Source, Source] | null): string {
  const state = status(game)
  if (state === 'won') return 'Board cleared — perfect game!'
  if (state === 'stuck') return 'No more matching cards — game over.'
  if (game.matching) return 'Match!'
  const e = game.event
  if (e?.kind === 'resolve' && e.unlocked.length) {
    const cols = e.unlocked.map(c => c + 1).join(' & ')
    return `Middle position unlocked in column ${cols} — worth ${MIDDLE_BONUS.toLocaleString()}!`
  }
  if (e?.kind === 'resolve' && e.bonus) return `Position cleared: +${e.bonus.toLocaleString()}`
  if (hint) return 'Hint: the highlighted cards match.'
  if (!findMatch(game)) return 'No matches available — draw a card.'
  return 'Select two cards with the same number.'
}

export default function App() {
  const [{ game, stats }, dispatch] = useReducer(appReducer, undefined, init)
  const [hint, setHint] = useState<[Source, Source] | null>(null)
  const [muted, setMuted] = useState(() => loadMuted(store))
  const [confirming, setConfirming] = useState(false)
  const [resultHidden, setResultHidden] = useState(false)

  const state = status(game)
  const over = state !== 'playing'
  const score = scoreOf(game.board)

  useEffect(() => saveGame(store, game), [game])
  useEffect(() => saveStats(store, stats), [stats])
  useEffect(() => saveMuted(store, muted), [muted])

  // Matched cards animate first; input is blocked by the rules until they are removed.
  useEffect(() => {
    if (!game.matching) return
    const timer = setTimeout(() => dispatch({ type: 'resolve' }), MATCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [game.matching])

  const lastEvent = useRef(game.event)
  useEffect(() => {
    const e = game.event
    if (!e || e === lastEvent.current) return
    lastEvent.current = e
    if (muted) return
    if (e.kind === 'select' || e.kind === 'draw') playSound('flip')
    else if (e.kind === 'match') playSound('match')
    else if (e.bonus >= MIDDLE_BONUS) playSound('big')
    else if (e.unlocked.length) playSound('unlock')
    else if (e.bonus) playSound('clear')
  }, [game.event, muted])

  const wasOver = useRef(over)
  useEffect(() => {
    if (over === wasOver.current) return
    wasOver.current = over
    if (!over || muted) return
    const timer = setTimeout(() => playSound(state === 'won' || isGoodResult(score) ? 'win' : 'lose'), 450)
    return () => clearTimeout(timer)
  }, [over, muted, state, score])

  const startNewGame = () => {
    dispatch({ type: 'new', game: newGame() })
    setHint(null)
    setConfirming(false)
    setResultHidden(false)
  }
  const requestNewGame = () => (hasProgress(game) ? setConfirming(true) : startNewGame())
  const onSelect = (source: Source) => {
    setHint(null)
    dispatch({ type: 'select', source })
  }
  const onDraw = () => {
    setHint(null)
    dispatch({ type: 'draw' })
  }
  const cancelConfirm = useCallback(() => setConfirming(false), [])
  const hideResult = useCallback(() => setResultHidden(true), [])

  const anyMatch = findMatch(game)

  return (
    <main className="app">
      <header className="top-bar">
        <h1>Stack Match</h1>
        <ScoreBoard score={score} highScore={stats.highScore} event={game.event} />
        <div className="actions">
          <button type="button" onClick={() => setHint(anyMatch)} disabled={over || !!game.matching || !anyMatch}>
            Hint
          </button>
          <button type="button" onClick={() => setMuted(m => !m)} aria-pressed={muted} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}>
            {muted ? '🔇' : '🔊'}
          </button>
          {over && resultHidden && (
            <button type="button" onClick={() => setResultHidden(false)}>Result</button>
          )}
          <button type="button" className="primary" onClick={requestNewGame}>New game</button>
        </div>
      </header>

      <p className="message" role="status">{statusMessage(game, hint)}</p>

      <Board game={game} hint={hint} onSelect={onSelect} />

      <DrawArea
        game={game}
        hint={hint}
        nudge={!over && !game.matching && !anyMatch && game.draw.length > 0}
        onDraw={onDraw}
        onSelect={onSelect}
      />

      <footer className="rules">
        Match two exposed cards with the same number (A–K, any suit). Clearing a top or bottom position scores 1,000.
        When both outer positions in a column are cleared, its middle position unlocks — clearing it scores 10,000.
        Draw from the remaining cards when you need a new match. A drawn card that isn't matched disappears when you draw the next one.
      </footer>

      {over && !resultHidden && (
        <ResultModal score={score} won={state === 'won'} stats={stats} onNewGame={startNewGame} onClose={hideResult} />
      )}
      {confirming && <ConfirmDialog onConfirm={startNewGame} onCancel={cancelConfirm} />}
    </main>
  )
}
