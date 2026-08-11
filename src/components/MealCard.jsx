import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TIPOS, MEAL_EMOJIS } from '../lib/constants'

function tipoLabel(tipo) {
  const found = TIPOS.find(t => t.key === tipo)
  return found ? found.label : tipo
}

export default function MealCard({ meal, index, isOpen, isOwner = true, onClick, onUpdate, onDelete }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  // editOverride holds local edits; null = show live meal data
  const [editOverride, setEditOverride] = useState(null)
  const draft = editOverride ?? { nome: meal.nome, emoji: meal.emoji, tipo: meal.tipo, ingredientes: meal.ingredientes || [] }
  const [newIng, setNewIng] = useState('')
  // confirmDelete resets when card closes — uses React's "state during render" pattern
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (!isOpen && confirmDelete) setConfirmDelete(false)
  }
  const [focusedInput, setFocusedInput] = useState(null)

  const setDraft = (fn) => setEditOverride(prev => typeof fn === 'function' ? fn(prev ?? draft) : fn)
  const saveEdit = () => { onUpdate(draft); setEditOverride(null); setEditing(false) }
  const cancelEdit = () => { setEditOverride(null); setEditing(false) }
  const addIng = () => { if (newIng.trim()) { setDraft(d => ({ ...d, ingredientes: [...d.ingredientes, newIng.trim()] })); setNewIng('') } }
  const removeIng = (i) => setDraft(d => ({ ...d, ingredientes: d.ingredientes.filter((_, ii) => ii !== i) }))

  const inputCls = (name) =>
    `w-full bg-black/40 border px-3.5 py-2.5 rounded-xl text-cream font-mono text-[0.88rem] outline-none transition-all ${
      focusedInput === name ? 'border-brand/60 shadow-[0_0_12px_rgba(255,90,38,0.3)]' : 'border-line'
    } ${name === 'nome' ? 'mb-2.5' : 'mb-3.5'}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
      className={`surface overflow-hidden transition-all duration-300 ${isOpen ? 'border-brand/40' : ''}`}
      style={isOpen ? { boxShadow: '0 8px 40px rgba(255,90,38,0.12)' } : {}}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer"
        onClick={onClick}
        role="button"
        aria-expanded={isOpen}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center w-12 h-12">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="emoji-bg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute w-12 h-12 rounded-xl bg-brand/15"
              />
            )}
          </AnimatePresence>
          <motion.span
            animate={isOpen ? { scale: 1.15 } : { scale: 1 }}
            className="relative z-10 text-2xl"
            style={{ filter: isOpen ? 'drop-shadow(0 0 10px rgba(255,90,38,0.4))' : 'none' }}
            aria-hidden="true"
          >
            {meal.emoji}
          </motion.span>
        </div>

        <div className="flex-1 min-w-0">
          {meal.tipo && (
            <div className="mb-1">
              <span className="font-sans text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-lg bg-brand/12 border border-brand/30 text-brand/90">
                {tipoLabel(meal.tipo)}
              </span>
            </div>
          )}
          <div className="font-display text-[1.05rem] font-bold text-cream leading-tight">{meal.nome}</div>
          <div className="font-mono text-[0.66rem] text-muted mt-0.5 tracking-[0.06em] uppercase">
            {(meal.ingredientes?.length || 0)} {t('meals.ingredients').toLowerCase()}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOwner && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              aria-label={`Editar ${meal.nome}`}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] text-muted hover:text-brand transition-colors"
            >
              <Pencil size={13} aria-hidden="true" />
            </motion.button>
          )}
          {isOwner && (
            !confirmDelete ? (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                aria-label={`Eliminar ${meal.nome}`}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] text-muted hover:text-brand transition-colors"
              >
                <Trash2 size={13} aria-hidden="true" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onDelete}
                  className="px-2.5 py-1 rounded-lg bg-brand text-black font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                >
                  {t('shopping.remove')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  aria-label="Cancelar"
                  className="px-2.5 py-1 rounded-lg border border-line bg-white/[0.03] text-muted font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                >
                  {t('pricing.cancel')}
                </button>
              </motion.div>
            )
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-muted flex items-center"
            aria-hidden="true"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-4 sm:p-5">
              {!editing ? (
                <div className="flex flex-wrap gap-2">
                  {(meal.ingredientes || []).map((ing, ii) => (
                    <motion.span
                      key={`${ing}-${ii}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: ii * 0.04 }}
                      className="bg-white/[0.04] border border-line rounded-xl px-3.5 py-1.5 text-[0.82rem] text-cream/90 flex items-center gap-1.5"
                    >
                      <span className="text-brand text-[0.7rem]" aria-hidden="true">•</span>
                      {ing}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2 mb-3.5" role="group" aria-label={t('meals.chooseEmoji')}>
                    {MEAL_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setDraft((d) => ({ ...d, emoji: e }))}
                        aria-label={e}
                        aria-pressed={draft.emoji === e}
                        className={`w-10 h-10 rounded-lg text-lg cursor-pointer transition-all ${
                          draft.emoji === e ? 'bg-brand/20 border border-brand/60' : 'bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <input
                    value={draft.nome}
                    onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                    placeholder={t('meals.name')}
                    aria-label={t('meals.name')}
                    onFocus={() => setFocusedInput('nome')}
                    onBlur={() => setFocusedInput(null)}
                    className={inputCls('nome')}
                  />
                  <div className="flex flex-wrap gap-1.5 mb-3.5" role="group" aria-label={t('meals.type')}>
                    {TIPOS.map(({ key, label }) => {
                      const active = draft.tipo === key
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setDraft(d => ({ ...d, tipo: active ? '' : key }))}
                          className="px-3 py-1.5 rounded-xl text-[0.75rem] font-medium transition-all border"
                          style={active
                            ? { background: 'rgba(255,90,38,0.15)', borderColor: 'rgba(255,90,38,0.5)', color: '#ff5a26' }
                            : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(245,245,244,0.5)' }
                          }
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {draft.ingredientes.map((ing, ii) => (
                      <span
                        key={`${ing}-${ii}`}
                        className="bg-white/[0.04] border border-line rounded-xl px-3 py-1 text-[0.8rem] text-cream/90 flex items-center gap-1.5"
                      >
                        {ing}
                        <button onClick={() => removeIng(ii)} aria-label={`Remover ${ing}`} className="bg-none border-0 text-muted hover:text-brand cursor-pointer p-0 flex">
                          <X size={11} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-3.5">
                    <input
                      value={newIng}
                      onChange={(e) => setNewIng(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addIng()}
                      placeholder={t('meals.addIngredient')}
                      aria-label={t('meals.addIngredient')}
                      onFocus={() => setFocusedInput('newIng')}
                      onBlur={() => setFocusedInput(null)}
                      className={inputCls('newIng')}
                    />
                    <button
                      onClick={addIng}
                      aria-label="Adicionar ingrediente"
                      className="px-3 flex items-center justify-center rounded-xl bg-brand/20 border border-brand/60 text-brand"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={saveEdit}
                      className="flex-1 py-2.5 rounded-xl bg-brand text-black font-mono text-[0.8rem] font-bold uppercase tracking-[0.08em] flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,90,38,0.3)]"
                    >
                      <Check size={15} aria-hidden="true" /> {t('common.continue')}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={cancelEdit}
                      className="py-2.5 px-3.5 rounded-xl border border-line bg-white/[0.03] text-muted font-mono text-[0.8rem] uppercase tracking-[0.08em]"
                    >
                      {t('pricing.cancel')}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
