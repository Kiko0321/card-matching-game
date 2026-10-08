import { cardName } from '../game/deck'
import { COLS, ROWS, isMiddle, isUnlocked, sameSource, type Game, type Source } from '../game/rules'
import { PlayingCard } from './PlayingCard'

type Props = {
  game: Game
  hint: [Source, Source] | null
  onSelect: (source: Source) => void
}

const ROW_NAMES = ['Top', 'Middle', 'Bottom']

export function Board({ game, hint, onSelect }: Props) {
  const event = game.event?.kind === 'resolve' ? game.event : null

  return (
    <section className="board" aria-label="Game board">
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const stack = game.board[row][col]
          const top = stack.at(-1)
          const unlocked = isUnlocked(game.board, row, col)
          const src: Source = { kind: 'board', row, col }
          const name = `${ROW_NAMES[row]} row, column ${col + 1}`
          const justUnlocked = isMiddle(row) && event?.unlocked.includes(col)

          return (
            <div key={`${row}-${col}`} className={`slot ${isMiddle(row) ? 'middle' : 'outer'} ${unlocked ? 'unlocked' : 'locked'}`}>
              {!top ? (
                <div className="cleared" aria-label={`${name}: cleared`}>✓</div>
              ) : unlocked ? (
                <PlayingCard
                  key={top.id}
                  card={top}
                  faceUp
                  depth={stack.length - 1}
                  selected={sameSource(game.selected, src)}
                  matched={game.matching?.some(m => sameSource(m, src))}
                  hinted={hint?.some(h => sameSource(h, src))}
                  label={`${name}: ${cardName(top)}, ${stack.length} left`}
                  onClick={() => onSelect(src)}
                >
                  <span className="count">{stack.length}</span>
                </PlayingCard>
              ) : (
                <PlayingCard faceUp={false} depth={stack.length - 1} disabled label={`${name}: locked`}>
                  <span className="lock" aria-hidden>🔒</span>
                </PlayingCard>
              )}
              {justUnlocked && <span key={event!.id} className="unlock-glow" aria-hidden />}
            </div>
          )
        }),
      )}
    </section>
  )
}
