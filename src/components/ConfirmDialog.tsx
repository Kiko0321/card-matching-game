import { Modal } from './Modal'

type Props = { onConfirm: () => void; onCancel: () => void }

export function ConfirmDialog({ onConfirm, onCancel }: Props) {
  return (
    <Modal title="Start a new game?" onClose={onCancel}>
      <h2>Start a new game?</h2>
      <p>Your current game will be lost. Your best score and stats are kept.</p>
      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onCancel} data-autofocus>Keep playing</button>
        <button type="button" className="danger" onClick={onConfirm}>New game</button>
      </div>
    </Modal>
  )
}
