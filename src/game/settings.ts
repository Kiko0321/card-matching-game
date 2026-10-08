export type Option<T extends string> = { value: T; label: string; swatch: string }

export const CARD_STYLES = [
  { value: 'classic', label: 'Classic', swatch: '#c62828' },
  { value: 'large', label: 'Large numbers', swatch: '#1d1d1d' },
  { value: 'four-color', label: 'Four colors', swatch: '#1565c0' },
] as const satisfies readonly Option<string>[]

export const CARD_BACKS = [
  { value: 'red', label: 'Red', swatch: '#8b2c3b' },
  { value: 'blue', label: 'Blue', swatch: '#24508f' },
  { value: 'green', label: 'Green', swatch: '#2f6b3a' },
  { value: 'purple', label: 'Purple', swatch: '#5b3a8c' },
] as const satisfies readonly Option<string>[]

export const TABLES = [
  { value: 'green', label: 'Green felt', swatch: '#1f5f3f' },
  { value: 'blue', label: 'Blue', swatch: '#1d4a73' },
  { value: 'burgundy', label: 'Burgundy', swatch: '#5e1f2b' },
  { value: 'dark', label: 'Dark', swatch: '#23262b' },
] as const satisfies readonly Option<string>[]

export type Settings = {
  cardStyle: (typeof CARD_STYLES)[number]['value']
  cardBack: (typeof CARD_BACKS)[number]['value']
  table: (typeof TABLES)[number]['value']
  animations: boolean
}

export const DEFAULT_SETTINGS: Settings = { cardStyle: 'classic', cardBack: 'red', table: 'green', animations: true }

function pick<T extends string>(options: readonly Option<T>[], value: unknown, fallback: T): T {
  return options.find(o => o.value === value)?.value ?? fallback
}

/** Rebuilds saved settings, falling back to defaults for anything missing or unknown. */
export function parseSettings(v: unknown): Settings {
  const s = typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}
  return {
    cardStyle: pick(CARD_STYLES, s.cardStyle, DEFAULT_SETTINGS.cardStyle),
    cardBack: pick(CARD_BACKS, s.cardBack, DEFAULT_SETTINGS.cardBack),
    table: pick(TABLES, s.table, DEFAULT_SETTINGS.table),
    animations: typeof s.animations === 'boolean' ? s.animations : DEFAULT_SETTINGS.animations,
  }
}
