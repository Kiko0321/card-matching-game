import type { CSSProperties, ReactNode } from 'react'
import { RANKS, SUITS, isRed } from '../game/deck'
import type { Card } from '../game/rules'

type Props = {
  card?: Card
  faceUp: boolean
  /** Cards still underneath this one, drawn as stacked edges. */
  depth?: number
  selected?: boolean
  matched?: boolean
  hinted?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
  className?: string
  children?: ReactNode
}

export function PlayingCard({ card, faceUp, depth = 0, selected, matched, hinted, disabled, label, onClick, className, children }: Props) {
  const classes = [
    'card',
    faceUp ? 'face-up' : 'face-down',
    faceUp && card && isRed(card) && 'red',
    faceUp && card && `suit-${card.suit}`,
    selected && 'selected',
    matched && 'matched',
    hinted && 'hinted',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classes}
      style={{ '--depth': Math.max(depth, 0) } as CSSProperties}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
    >
      {faceUp && card ? (
        <span className="face" aria-hidden>
          <span className="rank">{RANKS[card.rank]}</span>
          <span className="suit">{SUITS[card.suit]}</span>
        </span>
      ) : null}
      {children}
    </button>
  )
}
