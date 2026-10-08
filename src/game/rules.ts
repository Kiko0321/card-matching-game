import { createDeck, shuffle } from './deck'

export const ROWS = 3
export const COLS = 5
export const STACK_SIZE = 3
export const BOARD_CARDS = ROWS * COLS * STACK_SIZE
export const OUTER_BONUS = 1_000
export const MIDDLE_BONUS = 10_000
export const MAX_SCORE = COLS * (2 * OUTER_BONUS + MIDDLE_BONUS)
/** How long matched cards stay on screen (animating) before they are removed. */
export const MATCH_DELAY_MS = 320

/** rank: index into RANKS (A–K); suit: index into SUITS. Cards match on rank. */
export type Card = { id: number; rank: number; suit: number }
/** Bottom first; the last element is the top (exposed) card. */
export type Stack = Card[]
export type Position = { row: number; col: number }
export type Source = ({ kind: 'board' } & Position) | { kind: 'waste' }

export type GameEvent = {
  id: number
  kind: 'select' | 'draw' | 'recycle' | 'match' | 'resolve'
  /** Points earned by this event (only on 'resolve'). */
  bonus: number
  /** Columns whose middle position just unlocked. */
  unlocked: number[]
}

export type Game = {
  board: Stack[][]
  /** Face-down remaining cards; the last element is drawn next. */
  draw: Card[]
  /** Drawn cards, face up; only the last one is playable. */
  waste: Card[]
  selected: Source | null
  /** A successful match waiting to be removed. All input is ignored meanwhile. */
  matching: [Source, Source] | null
  event: GameEvent | null
}

export type Status = 'playing' | 'won' | 'stuck'

/**
 * Deals a deck in order: the first 45 cards fill the board row by row
 * (each stack bottom → top), the rest become the draw pile.
 */
export function newGame(deck: Card[] = shuffle(createDeck())): Game {
  const board: Stack[][] = []
  let next = 0
  for (let row = 0; row < ROWS; row++) {
    board.push([])
    for (let col = 0; col < COLS; col++) {
      board[row].push(deck.slice(next, next + STACK_SIZE))
      next += STACK_SIZE
    }
  }
  return { board, draw: deck.slice(next), waste: [], selected: null, matching: null, event: null }
}

export const isMiddle = (row: number) => row === 1

export const bonusFor = (row: number) => (isMiddle(row) ? MIDDLE_BONUS : OUTER_BONUS)

/** Outer rows are always open; a middle position opens once both outer positions in its column are cleared. */
export function isUnlocked(board: Stack[][], row: number, col: number): boolean {
  if (!isMiddle(row)) return true
  return board[0][col].length === 0 && board[2][col].length === 0
}

/** Score is derived from cleared positions, so a position can never be counted twice. */
export function scoreOf(board: Stack[][]): number {
  let score = 0
  board.forEach((stacks, row) => stacks.forEach(stack => { if (stack.length === 0) score += bonusFor(row) }))
  return score
}

/** The playable card at a source, or undefined if it is empty or locked. */
export function cardAt(game: Game, src: Source): Card | undefined {
  if (src.kind === 'waste') return game.waste.at(-1)
  if (!isUnlocked(game.board, src.row, src.col)) return undefined
  return game.board[src.row]?.[src.col]?.at(-1)
}

export function sameSource(a: Source | null | undefined, b: Source): boolean {
  if (!a || a.kind !== b.kind) return false
  return a.kind === 'waste' || (b.kind === 'board' && a.row === b.row && a.col === b.col)
}

export function availableSources(game: Game): Source[] {
  const sources: Source[] = []
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      if (cardAt(game, { kind: 'board', row, col })) sources.push({ kind: 'board', row, col })
  if (game.waste.length) sources.push({ kind: 'waste' })
  return sources
}

export function findMatch(game: Game): [Source, Source] | null {
  const seen = new Map<number, Source>()
  for (const src of availableSources(game)) {
    const rank = cardAt(game, src)!.rank
    const other = seen.get(rank)
    if (other) return [other, src]
    seen.set(rank, src)
  }
  return null
}

/**
 * True when some card in the remaining or drawn pile could still match an exposed
 * board card. Without a match the board never changes, and only one drawn card is
 * playable at a time, so pile cards can only ever pair with today's exposed board cards.
 */
function pilesCanHelp(game: Game): boolean {
  const exposed = new Set(availableSources(game).filter(s => s.kind === 'board').map(s => cardAt(game, s)!.rank))
  return [...game.draw, ...game.waste].some(card => exposed.has(card.rank))
}

/** The game ends as soon as no match is possible, now or from any card left in the piles. */
export function status(game: Game): Status {
  if (game.matching) return 'playing'
  if (game.board.every(row => row.every(stack => stack.length === 0))) return 'won'
  if (!findMatch(game) && !pilesCanHelp(game)) return 'stuck'
  return 'playing'
}

export const isOver = (game: Game) => status(game) !== 'playing'

function withEvent(game: Game, kind: GameEvent['kind'], bonus = 0, unlocked: number[] = []): GameEvent {
  return { id: (game.event?.id ?? 0) + 1, kind, bonus, unlocked }
}

export function select(game: Game, src: Source): Game {
  if (game.matching || isOver(game)) return game
  const card = cardAt(game, src)
  if (!card) return game

  const prev = game.selected
  if (sameSource(prev, src)) return { ...game, selected: null }
  // Nothing selected yet, or a mismatch: the new card becomes the selection and the old one stays in play.
  if (!prev || cardAt(game, prev)?.rank !== card.rank) {
    return { ...game, selected: src, event: withEvent(game, 'select') }
  }
  return { ...game, selected: null, matching: [prev, src], event: withEvent(game, 'match') }
}

/** Removes the pending matched pair, exposing the cards underneath. */
export function resolveMatch(game: Game): Game {
  if (!game.matching) return game
  const board = game.board.map(row => [...row])
  let waste = game.waste
  for (const src of game.matching) {
    if (src.kind === 'waste') waste = waste.slice(0, -1)
    else board[src.row][src.col] = board[src.row][src.col].slice(0, -1)
  }

  const bonus = scoreOf(board) - scoreOf(game.board)
  const unlocked: number[] = []
  for (let col = 0; col < COLS; col++)
    if (!isUnlocked(game.board, 1, col) && isUnlocked(board, 1, col) && board[1][col].length) unlocked.push(col)

  return { ...game, board, waste, matching: null, event: withEvent(game, 'resolve', bonus, unlocked) }
}

/**
 * Remaining-card rule (GAME-019/020): drawing turns the next remaining card face
 * up on the drawn pile, covering the previous one; only the top drawn card can be
 * matched. When the remaining pile is empty, clicking it turns the drawn pile back
 * over so the same cards can be drawn again in the same order (no limit).
 */
export function drawCard(game: Game): Game {
  if (game.matching || isOver(game)) return game
  if (!game.draw.length) {
    if (!game.waste.length) return game
    return {
      ...game,
      draw: [...game.waste].reverse(),
      waste: [],
      selected: game.selected?.kind === 'waste' ? null : game.selected,
      event: withEvent(game, 'recycle'),
    }
  }
  return {
    ...game,
    draw: game.draw.slice(0, -1),
    waste: [...game.waste, game.draw.at(-1)!],
    selected: game.selected?.kind === 'waste' ? null : game.selected,
    event: withEvent(game, 'draw'),
  }
}
