import { COPIES_PER_RANK, DECK_SIZE, RANKS, SUITS } from './deck'
import { COLS, MAX_TURN_OVERS, ROWS, STACK_SIZE, resolveMatch, type Card, type Game, type Source } from './rules'
import { parseSettings, type Settings } from './settings'
import { EMPTY_STATS, type Stats } from './stats'

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const GAME_KEY = 'stack-match:game:v1'
const STATS_KEY = 'stack-match:stats:v1'
const MUTED_KEY = 'stack-match:muted:v1'
const SETTINGS_KEY = 'stack-match:settings:v1'
const HELP_SEEN_KEY = 'stack-match:help-seen:v1'

/** localStorage, or null when it is unavailable (private mode, blocked site data). */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function read(store: KeyValueStore | null, key: string): unknown {
  try {
    const raw = store?.getItem(key)
    return raw == null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(store: KeyValueStore | null, key: string, value: unknown) {
  try {
    store?.setItem(key, JSON.stringify(value))
  } catch {
    // Quota exceeded or storage blocked: the game keeps working without saving.
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isIndex = (v: unknown, max: number): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < max
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0

function parseCard(v: unknown): Card | null {
  return isObject(v) && isIndex(v.id, DECK_SIZE) && isIndex(v.rank, RANKS.length) && isIndex(v.suit, SUITS.length)
    ? { id: v.id, rank: v.rank, suit: v.suit }
    : null
}

function parseCards(v: unknown, max: number): Card[] | null {
  if (!Array.isArray(v) || v.length > max) return null
  const cards = v.map(parseCard)
  return cards.every(c => c !== null) ? (cards as Card[]) : null
}

function parseSource(v: unknown): Source | null {
  if (!isObject(v)) return null
  if (v.kind === 'waste') return { kind: 'waste' }
  if (v.kind === 'board' && isIndex(v.row, ROWS) && isIndex(v.col, COLS)) return { kind: 'board', row: v.row, col: v.col }
  return null
}

/** Rebuilds a saved game, or returns null if the data is missing, corrupted or impossible. */
export function parseGame(v: unknown): Game | null {
  if (!isObject(v) || !Array.isArray(v.board) || v.board.length !== ROWS) return null
  const board: Card[][][] = []
  for (const row of v.board) {
    if (!Array.isArray(row) || row.length !== COLS) return null
    const stacks = row.map(stack => parseCards(stack, STACK_SIZE))
    if (stacks.some(s => s === null)) return null
    board.push(stacks as Card[][])
  }
  const draw = parseCards(v.draw, DECK_SIZE)
  const waste = parseCards(v.waste, DECK_SIZE)
  if (!draw || !waste) return null

  // Every remaining card must be unique, and cards only ever leave in pairs.
  const all = [...board.flat(2), ...draw, ...waste]
  const rankCounts = new Map<number, number>()
  for (const card of all) rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1)
  if (new Set(all.map(c => c.id)).size !== all.length) return null
  if (new Set(all.map(c => `${c.rank}-${c.suit}`)).size !== all.length) return null
  if (all.length % 2 !== 0 || [...rankCounts.values()].some(n => n > COPIES_PER_RANK)) return null

  const matching = Array.isArray(v.matching) ? v.matching.map(parseSource) : null
  const game: Game = {
    board,
    draw,
    waste,
    // Saves from before the turn-over limit have no count; treat them as unused.
    turnOvers: isIndex(v.turnOvers, MAX_TURN_OVERS + 1) ? v.turnOvers : 0,
    selected: parseSource(v.selected),
    matching: matching?.length === 2 && matching[0] && matching[1] ? [matching[0], matching[1]] : null,
    event: null,
  }
  // A match that was mid-animation when the page closed is completed now.
  return resolveMatch(game)
}

export const loadGame = (store: KeyValueStore | null) => parseGame(read(store, GAME_KEY))
export const saveGame = (store: KeyValueStore | null, game: Game) => write(store, GAME_KEY, game)

export function parseStats(v: unknown): Stats {
  if (!isObject(v)) return EMPTY_STATS
  const num = (key: keyof Stats) => (isCount(v[key]) ? (v[key] as number) : EMPTY_STATS[key])
  return { highScore: num('highScore'), lastScore: num('lastScore'), gamesPlayed: num('gamesPlayed'), goodGames: num('goodGames') }
}

export const loadStats = (store: KeyValueStore | null) => parseStats(read(store, STATS_KEY))
export const saveStats = (store: KeyValueStore | null, stats: Stats) => write(store, STATS_KEY, stats)

export const loadMuted = (store: KeyValueStore | null) => read(store, MUTED_KEY) === true
export const saveMuted = (store: KeyValueStore | null, muted: boolean) => write(store, MUTED_KEY, muted)

export const loadSettings = (store: KeyValueStore | null) => parseSettings(read(store, SETTINGS_KEY))
export const saveSettings = (store: KeyValueStore | null, settings: Settings) => write(store, SETTINGS_KEY, settings)
/** Whether the How to play guide has been shown once (it opens automatically on first launch). */
export const loadHelpSeen = (store: KeyValueStore | null) => read(store, HELP_SEEN_KEY) === true
export const saveHelpSeen = (store: KeyValueStore | null) => write(store, HELP_SEEN_KEY, true)
