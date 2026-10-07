import { COLS, drawCard, findMatch, resolveMatch, select, type Card, type Game, type Source } from './rules'

export const board = (row: number, col: number): Source => ({ kind: 'board', row, col })
export const WASTE: Source = { kind: 'waste' }

/**
 * A 52-card deck that solutionMoves() fully clears. Cards are planned as 26
 * pair "slots"; slot s uses rank ⌊s/2⌋, so each rank's 4 cards fill 2 slots.
 *  - slots 0–14:  each column's top and bottom stacks mirror each other
 *  - slots 15–20: middle stacks of columns 0 & 1, and 2 & 3, mirror each other
 *  - slots 21–23: column 4's middle stack, partnered by the first 3 draws
 *  - slots 24–25: the last 4 draws, never needed
 */
export function solvableDeck(): Card[] {
  let id = 0
  const used = new Map<number, number>()
  const card = (slot: number): Card => {
    const rank = Math.floor(slot / 2)
    const suit = used.get(rank) ?? 0
    used.set(rank, suit + 1)
    return { id: id++, rank, suit }
  }
  const cols = Array.from({ length: COLS }, (_, c) => c)
  const outer = (c: number) => [c * 3, c * 3 + 1, c * 3 + 2]
  const middle = [[15, 16, 17], [15, 16, 17], [18, 19, 20], [18, 19, 20], [21, 22, 23]]

  const top = cols.flatMap(c => outer(c).map(card))
  const mid = cols.flatMap(c => middle[c].map(card))
  const bottom = cols.flatMap(c => outer(c).map(card))
  const drawnInOrder = [23, 22, 21, 24, 24, 25, 25].map(card)
  return [...top, ...mid, ...bottom, ...drawnInOrder.reverse()]
}

export type Move = { type: 'match'; a: Source; b: Source } | { type: 'draw' }

/** The moves that clear a solvableDeck() board completely. */
export function solutionMoves(): Move[] {
  const moves: Move[] = []
  const pair = (a: Source, b: Source) => { for (let i = 0; i < 3; i++) moves.push({ type: 'match', a, b }) }
  for (let col = 0; col < COLS; col++) pair(board(0, col), board(2, col))
  pair(board(1, 0), board(1, 1))
  pair(board(1, 2), board(1, 3))
  for (let i = 0; i < 3; i++) moves.push({ type: 'draw' }, { type: 'match', a: board(1, 4), b: WASTE })
  return moves
}

/** Selects two sources and completes the match animation. */
export function match(game: Game, a: Source, b: Source): Game {
  return resolveMatch(select(select(game, a), b))
}

export function applyMoves(game: Game, moves: Move[]): Game {
  return moves.reduce((g, m) => (m.type === 'draw' ? drawCard(g) : match(g, m.a, m.b)), game)
}

/** Plays greedily (match when possible, otherwise draw) until the game ends. */
export function autoPlay(game: Game): Game {
  for (let guard = 0; guard < 500; guard++) {
    const pair = findMatch(game)
    const next = pair ? match(game, pair[0], pair[1]) : drawCard(game)
    if (next === game) return game
    game = next
  }
  throw new Error('autoPlay did not terminate')
}
