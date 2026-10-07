import { MAX_SCORE, type GameEvent } from '../game/rules'

type Props = { score: number; highScore: number; event: GameEvent | null }

export function ScoreBoard({ score, highScore, event }: Props) {
  const gain = event?.kind === 'resolve' && event.bonus > 0 ? event : null

  return (
    <div className="scoreboard">
      <div className="score" aria-live="polite">
        <span className="label">Score</span>
        <strong key={score} className="score-value">{score.toLocaleString()}</strong>
        <span className="max">/ {MAX_SCORE.toLocaleString()}</span>
        {gain && (
          <span key={gain.id} className={gain.bonus >= 10_000 ? 'gain big' : 'gain'} aria-hidden>
            +{gain.bonus.toLocaleString()}
          </span>
        )}
      </div>
      <div className="best">
        <span className="label">Best</span>
        <span>{highScore.toLocaleString()}</span>
      </div>
    </div>
  )
}
