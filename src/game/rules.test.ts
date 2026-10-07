import { describe, expect, it } from 'vitest'
import { DECK_SIZE, RANKS, SUITS, createDeck, shuffle } from './deck'
import {
  BOARD_CARDS,
  COLS,
  MAX_SCORE,
  ROWS,
  cardAt,
  drawCard,
  isUnlocked,
  newGame,
  resolveMatch,
  scoreOf,
  select,
  status,
  type Card,
  type Game,
} from './rules'
import { WASTE, applyMoves, autoPlay, board, match, solutionMoves, solvableDeck } from './testUtils'

const allCards = (game: Game): Card[] => [...game.board.flat(2), ...game.draw, ...game.waste]

/** Clears the top and bottom stacks of one column of a solvableDeck game. */
function clearOuter(game: Game, col: number): Game {
  for (let i = 0; i < 3; i++) game = match(game, board(0, col), board(2, col))
  return game
}

describe('deck', () => {
  it('is a standard 52-card deck with four of each number', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map(c => c.id)).size).toBe(52)
    expect(new Set(deck.map(c => `${c.rank}-${c.suit}`)).size).toBe(52)
    for (let rank = 0; rank < RANKS.length; rank++) expect(deck.filter(c => c.rank === rank)).toHaveLength(SUITS.length)
  })

  it('builds a valid test deck', () => {
    const deck = solvableDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map(c => `${c.rank}-${c.suit}`)).size).toBe(52)
  })

  it('shuffles into a different order without losing cards', () => {
    const deck = createDeck()
    const a = shuffle(deck)
    const b = shuffle(deck)
    expect(a.map(c => c.id).sort((x, y) => x - y)).toEqual(deck.map(c => c.id))
    expect(a.map(c => c.id)).not.toEqual(b.map(c => c.id))
  })
})

describe('dealing', () => {
  it('fills 15 positions with 3 cards and puts the rest in the draw pile', () => {
    const game = newGame()
    expect(game.board).toHaveLength(ROWS)
    game.board.forEach(row => {
      expect(row).toHaveLength(COLS)
      row.forEach(stack => expect(stack).toHaveLength(3))
    })
    expect(game.draw).toHaveLength(DECK_SIZE - BOARD_CARDS)
    expect(game.waste).toHaveLength(0)
    expect(new Set(allCards(game).map(c => c.id)).size).toBe(DECK_SIZE)
  })

  it('starts with the middle row locked and the outer rows open', () => {
    const game = newGame()
    for (let col = 0; col < COLS; col++) {
      expect(isUnlocked(game.board, 0, col)).toBe(true)
      expect(isUnlocked(game.board, 2, col)).toBe(true)
      expect(isUnlocked(game.board, 1, col)).toBe(false)
      expect(cardAt(game, board(1, col))).toBeUndefined()
      expect(select(game, board(1, col))).toBe(game)
    }
  })
})

describe('matching', () => {
  const game = newGame(solvableDeck())

  it('keeps mismatched cards in play and moves the selection', () => {
    const next = select(select(game, board(0, 0)), board(0, 1))
    expect(next.selected).toEqual(board(0, 1))
    expect(next.matching).toBeNull()
    expect(allCards(next)).toHaveLength(DECK_SIZE)
  })

  it('deselects when the same card is clicked twice', () => {
    expect(select(select(game, board(0, 0)), board(0, 0)).selected).toBeNull()
  })

  it('removes a matched pair and exposes the cards underneath', () => {
    const pending = select(select(game, board(0, 0)), board(2, 0))
    expect(pending.matching).not.toBeNull()
    const next = resolveMatch(pending)
    expect(next.board[0][0]).toHaveLength(2)
    expect(next.board[2][0]).toHaveLength(2)
    expect(cardAt(next, board(0, 0))).toEqual(game.board[0][0][1])
  })

  it('ignores every input while a match is animating', () => {
    const pending = select(select(game, board(0, 0)), board(2, 0))
    expect(select(pending, board(0, 1))).toBe(pending)
    expect(select(pending, board(0, 0))).toBe(pending)
    expect(drawCard(pending)).toBe(pending)
    expect(resolveMatch(resolveMatch(pending)).board[0][0]).toHaveLength(2)
  })
})

describe('scoring and unlocking', () => {
  const start = newGame(solvableDeck())

  it('awards 1,000 for each cleared outer position, once', () => {
    const game = clearOuter(start, 2)
    expect(game.board[0][2]).toHaveLength(0)
    expect(scoreOf(game.board)).toBe(2_000)
    expect(game.event).toMatchObject({ kind: 'resolve', bonus: 2_000 })
    // Further play elsewhere doesn't re-award that position.
    expect(scoreOf(match(game, board(0, 0), board(2, 0)).board)).toBe(2_000)
  })

  it('unlocks only the middle position of the cleared column', () => {
    const game = clearOuter(start, 2)
    expect(game.event?.unlocked).toEqual([2])
    for (let col = 0; col < COLS; col++) expect(isUnlocked(game.board, 1, col)).toBe(col === 2)
  })

  it('does not unlock a middle position when only one outer position is cleared', () => {
    const topCleared = start.board.map((row, r) => row.map((stack, c) => (r === 0 && c === 0 ? [] : stack)))
    expect(isUnlocked(topCleared, 1, 0)).toBe(false)
  })

  it('lets unlocked middle cards match and awards 10,000 when cleared', () => {
    let game = clearOuter(start, 4)
    for (let i = 0; i < 3; i++) {
      game = drawCard(game)
      expect(cardAt(game, board(1, 4))?.rank).toBe(game.waste.at(-1)?.rank)
      game = match(game, board(1, 4), WASTE)
    }
    expect(game.board[1][4]).toHaveLength(0)
    expect(scoreOf(game.board)).toBe(12_000)
  })

  it('scores exactly 60,000 for a fully cleared board', () => {
    const game = applyMoves(newGame(solvableDeck()), solutionMoves())
    expect(status(game)).toBe('won')
    expect(scoreOf(game.board)).toBe(MAX_SCORE)
    expect(MAX_SCORE).toBe(60_000)
  })
})

describe('remaining cards', () => {
  const start = newGame(solvableDeck())

  it('turns the next remaining card face up', () => {
    const game = drawCard(start)
    expect(game.draw).toHaveLength(start.draw.length - 1)
    expect(game.waste).toEqual([start.draw.at(-1)])
    expect(cardAt(game, WASTE)).toEqual(start.draw.at(-1))
  })

  it('only lets the newest drawn card be played', () => {
    const game = drawCard(drawCard(start))
    expect(cardAt(game, WASTE)).toEqual(start.draw.at(-2))
    expect(allCards(game)).toHaveLength(DECK_SIZE)
  })

  it('does nothing when the draw pile is empty', () => {
    const empty = { ...start, draw: [] }
    expect(drawCard(empty)).toBe(empty)
  })
})

describe('game end', () => {
  it('is stuck when nothing is left to draw and no match is available', () => {
    // In this deck every top-row card's partner is in the bottom row, so removing the bottom row leaves no pairs.
    const start = newGame(solvableDeck())
    const noPairs: Game = { ...start, draw: [], board: start.board.map((row, r) => (r === 2 ? row.map(() => []) : row)) }
    expect(status(noPairs)).toBe('stuck')
    expect(select(noPairs, board(0, 0))).toBe(noPairs)
  })

  it('ends as soon as none of the remaining cards can match', () => {
    // Exposed top-row cards are ranks 1, 2, 4, 5 and 7; all four Ks (rank 12) are left to draw.
    const start = newGame(solvableDeck())
    const kings = [0, 1, 2, 3].map(suit => ({ id: 100 + suit, rank: 12, suit }))
    const noPairs: Game = { ...start, draw: kings, board: start.board.map((row, r) => (r === 2 ? row.map(() => []) : row)) }
    expect(status(noPairs)).toBe('stuck')
    expect(drawCard(noPairs)).toBe(noPairs)
    // One useful card left in the draw pile keeps the game going.
    expect(status({ ...noPairs, draw: [...kings, { id: 99, rank: 1, suit: 3 }] })).toBe('playing')
  })

  it('keeps playing while a match is still available', () => {
    expect(status({ ...newGame(solvableDeck()), draw: [] })).toBe('playing')
  })

  it('always ends with a consistent score on random deals', () => {
    for (let i = 0; i < 50; i++) {
      const game = autoPlay(newGame())
      expect(status(game)).not.toBe('playing')
      expect(scoreOf(game.board) % 1_000).toBe(0)
      expect(scoreOf(game.board)).toBeLessThanOrEqual(MAX_SCORE)
    }
  })
})
