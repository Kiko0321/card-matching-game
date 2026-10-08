import { cardName } from '../game/deck'
import { sameSource, type Game, type Source } from '../game/rules'
import { PlayingCard } from './PlayingCard'

type Props = {
  game: Game
  hint: [Source, Source] | null
  /** Draw pile pulses when the board has no match left. */
  nudge: boolean
  onDraw: () => void
  onSelect: (source: Source) => void
}

const WASTE: Source = { kind: 'waste' }

export function DrawArea({ game, hint, nudge, onDraw, onSelect }: Props) {
  const top = game.waste.at(-1)
  // An empty remaining pile turns the drawn cards back over.
  const canRecycle = game.draw.length === 0 && game.waste.length > 0

  return (
    <section className="draw-area" aria-label="Remaining cards">
      <div className="pile-col">
        {canRecycle ? (
          <button
            type="button"
            className={nudge ? 'recycle nudge' : 'recycle'}
            onClick={onDraw}
            aria-label={`Turn over the ${game.waste.length} drawn cards to draw them again`}
          >
            <span className="recycle-icon" aria-hidden>↻</span>
            <span>Turn over</span>
          </button>
        ) : (
          <PlayingCard
            faceUp={false}
            depth={Math.min(game.draw.length - 1, 4)}
            className={nudge ? 'pile nudge' : 'pile'}
            disabled={game.draw.length === 0}
            label={`Draw a card, ${game.draw.length} left`}
            onClick={onDraw}
          >
            <span className="pile-label">{game.draw.length ? 'Draw' : 'Empty'}</span>
            <span className="count">{game.draw.length}</span>
          </PlayingCard>
        )}
        <span className="pile-caption">Remaining</span>
      </div>
      <div className="pile-col">
        {top ? (
          <PlayingCard
            key={top.id}
            card={top}
            faceUp
            depth={Math.min(game.waste.length - 1, 4)}
            selected={sameSource(game.selected, WASTE)}
            matched={game.matching?.some(m => sameSource(m, WASTE))}
            hinted={hint?.some(h => sameSource(h, WASTE))}
            label={`Drawn card: ${cardName(top)}`}
            onClick={() => onSelect(WASTE)}
          >
            <span className="count">{game.waste.length}</span>
          </PlayingCard>
        ) : (
          <div className="cleared empty">No card drawn</div>
        )}
        <span className="pile-caption">Drawn</span>
      </div>
    </section>
  )
}
