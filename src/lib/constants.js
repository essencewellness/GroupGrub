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
