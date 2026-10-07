import type { Card } from './rules'

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SUITS = ['♠', '♥', '♦', '♣']
export const COPIES_PER_RANK = SUITS.length

/** Standard 52-card deck: 45 on the board, 7 in the draw pile. */
export const DECK_SIZE = RANKS.length * SUITS.length

export const isRed = (card: Card) => card.suit === 1 || card.suit === 2

export const cardName = (card: Card) => `${RANKS[card.rank]}${SUITS[card.suit]}`

/** Any two cards with the same rank match, whatever their suit. */
export function createDeck(): Card[] {
  return RANKS.flatMap((_, rank) => SUITS.map((_, suit) => ({ rank, suit }))).map((card, id) => ({ id, ...card }))
}

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
