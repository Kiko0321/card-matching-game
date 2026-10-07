import { MAX_SCORE } from '../game/rules'
import { isGoodResult, resultMessage, type Stats } from '../game/stats'
import { Modal } from './Modal'

type Props = { score: number; won: boolean; stats: Stats; onNewGame: () => void; onClose: () => void }

export function ResultModal({ score, won, stats, onNewGame, onClose }: Props) {
  const isBest = score > 0 && score === stats.highScore

  return (
    <Modal title="Game over" onClose={onClose}>
      <p className="modal-kicker">{won ? 'Board cleared!' : 'No more matching cards'}</p>
      <h2 className={isGoodResult(score) ? 'result-title good' : 'result-title'}>{resultMessage(score)}</h2>
      <p className="final-score">
        <strong>{score.toLocaleString()}</strong> / {MAX_SCORE.toLocaleString()}
      </p>
      {isBest && <p className="new-best">New best score!</p>}
      <dl className="stats">
        <div><dt>Best</dt><dd>{stats.highScore.toLocaleString()}</dd></div>
        <div><dt>Last</dt><dd>{stats.lastScore.toLocaleString()}</dd></div>
        <div><dt>Played</dt><dd>{stats.gamesPlayed}</dd></div>
        <div><dt>Good Lucky</dt><dd>{stats.goodGames}</dd></div>
      </dl>
      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onClose}>View board</button>
        <button type="button" className="primary" onClick={onNewGame} data-autofocus>New game</button>
      </div>
    </Modal>
  )
}
