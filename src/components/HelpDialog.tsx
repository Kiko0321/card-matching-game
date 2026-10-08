import { Modal } from './Modal'

type Props = { onClose: () => void }

export function HelpDialog({ onClose }: Props) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <h2>How to play</h2>
      <div className="help">
        <section>
          <h3>The board</h3>
          <p>
            The board has 3 rows of 5 positions, and each position is a stack of 3 cards. Only the top card of each
            stack in the <strong>top and bottom rows</strong> can be played. The <strong>middle row is locked</strong> 🔒
            at the start.
          </p>
        </section>

        <section>
          <h3>Matching</h3>
          <p>
            Tap two playable cards with the <strong>same number</strong> (A–K, any suit). Both are removed and the
            cards underneath are revealed.
          </p>
        </section>

        <section>
          <h3>Scoring</h3>
          <ul>
            <li>Clear a position in the top or bottom row: <strong>1,000</strong></li>
            <li>When the top and bottom positions of a column are both cleared, that column's middle position unlocks.</li>
            <li>Clear a middle position: <strong>10,000</strong></li>
            <li>Clearing the whole board scores the maximum: <strong>60,000</strong></li>
          </ul>
        </section>

        <section>
          <h3>Remaining cards</h3>
          <ul>
            <li>Tap the remaining pile to draw a card. The drawn card can be matched with a board card.</li>
            <li>Each new card covers the previous one. Only the top drawn card can be used.</li>
            <li>When the remaining pile is empty, tap <strong>↻ Turn over</strong> to draw the same cards again. You can do this <strong>3 times</strong> per game.</li>
          </ul>
        </section>

        <section>
          <h3>Hints and game end</h3>
          <ul>
            <li><strong>Hint</strong> highlights a matching pair. If no match is showing for 5 seconds, the remaining pile glows.</li>
            <li>The game ends when the board is cleared or no more matches are possible.</li>
            <li>Score over 35,000 for <strong>Good Lucky</strong>!</li>
          </ul>
        </section>

        <p className="help-tip">
          💡 Tip: work on one column at a time. Clearing its top and bottom unlocks the middle card, which is worth 10,000.
        </p>
      </div>
      <div className="modal-actions">
        <button type="button" className="primary" onClick={onClose} data-autofocus>Got it</button>
      </div>
    </Modal>
  )
}
