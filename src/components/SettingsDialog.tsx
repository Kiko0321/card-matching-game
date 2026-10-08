import { CARD_BACKS, CARD_STYLES, TABLES, type Option, type Settings } from '../game/settings'
import { Modal } from './Modal'

type Props = {
  settings: Settings
  muted: boolean
  onChange: (settings: Settings) => void
  onMutedChange: (muted: boolean) => void
  onClose: () => void
}

function Choice<T extends string>({ title, options, value, onPick }: {
  title: string
  options: readonly Option<T>[]
  value: T
  onPick: (value: T) => void
}) {
  return (
    <fieldset className="setting">
      <legend>{title}</legend>
      <div className="choices">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            className={o.value === value ? 'choice active' : 'choice'}
            aria-pressed={o.value === value}
            onClick={() => onPick(o.value)}
          >
            <span className="swatch" style={{ background: o.swatch }} aria-hidden />
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (on: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onToggle(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function SettingsDialog({ settings, muted, onChange, onMutedChange, onClose }: Props) {
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  return (
    <Modal title="Settings" onClose={onClose}>
      <h2>Settings</h2>
      <div className="settings">
        <Choice title="Card style" options={CARD_STYLES} value={settings.cardStyle} onPick={v => set('cardStyle', v)} />
        <Choice title="Card back" options={CARD_BACKS} value={settings.cardBack} onPick={v => set('cardBack', v)} />
        <Choice title="Table" options={TABLES} value={settings.table} onPick={v => set('table', v)} />
        <fieldset className="setting">
          <legend>Other</legend>
          <Toggle label="Sound effects" checked={!muted} onToggle={on => onMutedChange(!on)} />
          <Toggle label="Animations" checked={settings.animations} onToggle={on => set('animations', on)} />
        </fieldset>
      </div>
      <div className="modal-actions">
        <button type="button" className="primary" onClick={onClose} data-autofocus>Done</button>
      </div>
    </Modal>
  )
}
