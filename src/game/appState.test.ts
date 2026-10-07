import { describe, expect, it } from 'vitest'
import { appReducer, hasProgress, type AppState } from './appState'
import { newGame } from './rules'
import { EMPTY_STATS, recordResult, resultMessage } from './stats'
import { solutionMoves, solvableDeck } from './testUtils'

/** Plays the winning line for solvableDeck() through the app reducer. */
function play(state: AppState): AppState {
  for (const move of solutionMoves()) {
    if (move.type === 'draw') {
      state = appReducer(state, { type: 'draw' })
      continue
    }
    state = appReducer(state, { type: 'select', source: move.a })
    state = appReducer(state, { type: 'select', source: move.b })
    state = appReducer(state, { type: 'resolve' })
  }
  return state
}

describe('result message', () => {
  it('shows "Good Lucky" only above 35,000', () => {
    expect(resultMessage(36_000)).toBe('Good Lucky')
    expect(resultMessage(60_000)).toBe('Good Lucky')
    expect(resultMessage(35_000)).not.toBe('Good Lucky')
    expect(resultMessage(0)).not.toBe('Good Lucky')
  })
})

describe('stats', () => {
  it('records high score, last score, games played and good games', () => {
    let stats = recordResult(EMPTY_STATS, 12_000)
    stats = recordResult(stats, 40_000)
    stats = recordResult(stats, 3_000)
    expect(stats).toEqual({ highScore: 40_000, lastScore: 3_000, gamesPlayed: 3, goodGames: 1 })
  })

  it('records a finished game exactly once and then freezes it', () => {
    const finished = play({ game: newGame(solvableDeck()), stats: EMPTY_STATS })
    expect(finished.stats).toEqual({ highScore: 60_000, lastScore: 60_000, gamesPlayed: 1, goodGames: 1 })
    expect(appReducer(finished, { type: 'draw' })).toBe(finished)
    expect(appReducer(finished, { type: 'resolve' })).toBe(finished)
  })

  it('keeps stats when a new game starts', () => {
    const finished = play({ game: newGame(solvableDeck()), stats: EMPTY_STATS })
    const fresh = appReducer(finished, { type: 'new', game: newGame() })
    expect(fresh.stats).toBe(finished.stats)
    expect(fresh.game.board.flat(2)).toHaveLength(45)
  })
})

describe('reset confirmation', () => {
  it('only asks once the player has made progress in an unfinished game', () => {
    const fresh = newGame(solvableDeck())
    expect(hasProgress(fresh)).toBe(false)
    const drawn = appReducer({ game: fresh, stats: EMPTY_STATS }, { type: 'draw' }).game
    expect(hasProgress(drawn)).toBe(true)
    expect(hasProgress(play({ game: fresh, stats: EMPTY_STATS }).game)).toBe(false)
  })
})
