import { describe, expect, it } from 'vitest'
import { drawCard, newGame, select } from './rules'
import { EMPTY_STATS } from './stats'
import { loadGame, loadMuted, loadStats, saveGame, saveMuted, saveStats, type KeyValueStore } from './storage'
import { board, match, solvableDeck } from './testUtils'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: key => void data.delete(key),
  }
}

const GAME_KEY = 'stack-match:game:v1'
const STATS_KEY = 'stack-match:stats:v1'

describe('saving an unfinished game', () => {
  it('restores board, remaining cards, drawn cards and score after a refresh', () => {
    const store = memoryStore()
    const game = drawCard(match(newGame(solvableDeck()), board(0, 0), board(2, 0)))
    saveGame(store, game)
    const restored = loadGame(store)!
    expect(restored.board).toEqual(game.board)
    expect(restored.draw).toEqual(game.draw)
    expect(restored.waste).toEqual(game.waste)
  })

  it('completes a match that was animating when the page closed', () => {
    const store = memoryStore()
    saveGame(store, select(select(newGame(solvableDeck()), board(0, 0)), board(2, 0)))
    const restored = loadGame(store)!
    expect(restored.matching).toBeNull()
    expect(restored.board[0][0]).toHaveLength(2)
  })
})

describe('recovering from bad saved data', () => {
  const save = (value: string) => {
    const store = memoryStore()
    store.setItem(GAME_KEY, value)
    return loadGame(store)
  }
  const valid = () => JSON.parse(JSON.stringify(newGame(solvableDeck())))

  it('returns null when nothing is saved', () => {
    expect(loadGame(memoryStore())).toBeNull()
  })

  it('rejects corrupted JSON', () => {
    expect(save('{not json')).toBeNull()
    expect(save('null')).toBeNull()
    expect(save('42')).toBeNull()
  })

  it('rejects a board with the wrong shape', () => {
    const data = valid()
    data.board.pop()
    expect(save(JSON.stringify(data))).toBeNull()
    const tall = valid()
    tall.board[0][0].push({ id: 51, rank: 0, suit: 0 })
    expect(save(JSON.stringify(tall))).toBeNull()
  })

  it('rejects duplicated, unknown or unpaired cards', () => {
    const dup = valid()
    dup.draw[0] = dup.board[0][0][0]
    expect(save(JSON.stringify(dup))).toBeNull()

    const badFace = valid()
    badFace.draw[0].rank = 999
    expect(save(JSON.stringify(badFace))).toBeNull()

    const odd = valid()
    odd.draw.pop()
    expect(save(JSON.stringify(odd))).toBeNull()
  })

  it('drops an invalid selection instead of rejecting the game', () => {
    const data = valid()
    data.selected = { kind: 'board', row: 9, col: 0 }
    expect(save(JSON.stringify(data))?.selected).toBeNull()
  })

  it('survives storage that throws', () => {
    const broken: KeyValueStore = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => {},
    }
    expect(loadGame(broken)).toBeNull()
    expect(loadStats(broken)).toEqual(EMPTY_STATS)
    expect(() => saveGame(broken, newGame())).not.toThrow()
    expect(loadGame(null)).toBeNull()
  })
})

describe('stats and settings', () => {
  it('round-trips stats', () => {
    const store = memoryStore()
    const stats = { highScore: 42_000, lastScore: 7_000, gamesPlayed: 5, goodGames: 2 }
    saveStats(store, stats)
    expect(loadStats(store)).toEqual(stats)
  })

  it('falls back to defaults for missing or invalid stats', () => {
    const store = memoryStore()
    expect(loadStats(store)).toEqual(EMPTY_STATS)
    store.setItem(STATS_KEY, JSON.stringify({ highScore: -5, lastScore: 'x', gamesPlayed: 3 }))
    expect(loadStats(store)).toEqual({ ...EMPTY_STATS, gamesPlayed: 3 })
  })

  it('remembers the mute setting', () => {
    const store = memoryStore()
    expect(loadMuted(store)).toBe(false)
    saveMuted(store, true)
    expect(loadMuted(store)).toBe(true)
  })
})
