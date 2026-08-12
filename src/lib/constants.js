// Centralised constants shared across components.
// Import from here — never re-declare inline.

export const CATS = {
  dispensa:   { label: 'Dispensa',         icon: '🥫', color: '#f5a623', desc: 'Compra com antecedência' },
  bebidas:    { label: 'Bebidas',           icon: '🍷', color: '#3aa0ff', desc: 'Compra com antecedência' },
  talho:      { label: 'Talho & Peixaria', icon: '🥩', color: '#ff6b6b', desc: '1–2 dias antes' },
  laticinios: { label: 'Laticínios',       icon: '🧀', color: '#9b7bff', desc: '1–2 dias antes' },
  fresco:     { label: 'Frescos',          icon: '🥦', color: '#34d399', desc: 'Comprar no dia' },
  outro:      { label: 'Outros',           icon: '📦', color: '#6b8299', desc: '' },
}

export const CAT_ORDER = ['dispensa', 'bebidas', 'talho', 'laticinios', 'fresco', 'outro']

export const TIPOS = [
  { key: 'prato_principal', label: '🍽️ Prato Principal' },
  { key: 'petisco',         label: '🫙 Petisco' },
  { key: 'pequeno_almoco',  label: '🌅 Pequeno-almoço' },
  { key: 'sobremesa',       label: '🍰 Sobremesa' },
  { key: 'brunch',          label: '☕ Brunch' },
  { key: 'bebidas',         label: '🥤 Bebidas' },
]

export const MEAL_EMOJIS = ['🍽️', '🫕', '🔥', '🐟', '🥩', '🌅', '🥤', '🥗', '🍳', '🥘', '🍖', '🥪', '🍕', '🌮', '🍲', '🫙', '🍰', '🤌', '🦐', '🍝', '🍔', '🥞', '🌯', '🍱']

// ── Magic number constants ──────────────────────────────────────────────────
// Centralised so a single change propagates everywhere.

/** Maximum length for guest/owner names (enforced in inputs and stored values). */
export const GUEST_NAME_MAX_LENGTH = 60

/** How long (ms) a toast notification stays visible. */
export const TOAST_DURATION_MS = 2800

/** Delay (ms) before switching to the shopping tab after adding ingredients. */
export const TAB_SWITCH_DELAY_MS = 400

/** Application name constant — avoids hardcoding 'GroupGrub' in templates/exports. */
export const APP_NAME = 'GroupGrub'

/** Minimum valid trip-ID length used as a sanity guard throughout. */
export const TRIP_ID_MIN_LENGTH = 6
