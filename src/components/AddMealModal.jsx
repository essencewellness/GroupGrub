import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Check, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import { suggestEmoji } from '../lib/mealEmoji'
import { TIPOS, MEAL_EMOJIS as EMOJIS } from '../lib/constants'

export default function AddMealModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
  const [newIng, setNewIng] = useState('')
  const [focusedInput, setFocusedInput] = useState(null)
  const [autoEmoji, setAutoEmoji] = useState(null)
  const debounceRef = useRef(null)

  // Auto-detect emoji from meal name — all setState inside setTimeout callback (async)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!form.nome.trim()) return
    debounceRef.current = setTimeout(() => {
      const suggested = suggestEmoji(form.nome)
      setAutoEmoji(suggested && suggested !== form.emoji ? suggested : null)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [form.nome, form.emoji])
  // Clear suggestion when name is empty — derived, not tracked separately
  const activeAutoEmoji = form.nome.trim() ? autoEmoji : null

  const applyAutoEmoji = () => {
    if (activeAutoEmoji) {
      setForm(f => ({ ...f, emoji: activeAutoEmoji }))
      setAutoEmoji(null)
    }
  }

  const addIng = () => {
    if (newIng.trim()) {
      setForm(f => ({ ...f, ingredientes: [...f.ingredientes, newIng.trim()] }))
      setNewIng('')
    }
  }

  const removeIng = (i) => setForm(f => ({ ...f, ingredientes: f.ingredientes.filter((_, ii) => ii !== i) }))

  const submit = () => {
    if (!form.nome.trim()) return
    onAdd(form)
    setForm({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
    setAutoEmoji(null)
    onClose()
  }

  const inputCls = (name) =>
    `w-full bg-black/50 border px-4 py-3 rounded-xl text-cream font-sans text-base outline-none transition-all mb-3 ${
      focusedInput === name ? 'border-brand/60 shadow-[0_0_0_2px_rgba(255,90,38,0.2)]' : 'border-line'
    }`

  return (
    <Modal open={open} onClose={onClose} title={t('meals.add')}>
      {/* Emoji picker */}
      <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase mb-2">
        {t('meals.chooseEmoji')}
      </div>
      <div className="flex flex-wrap gap-2 mb-1.5">
        {EMOJIS.map((e) => (
          <motion.button
            key={e}
            whileTap={{ scale: 0.9 }}
            aria-label={e}
            aria-pressed={form.emoji === e}
            onClick={() => { setForm(f => ({ ...f, emoji: e })); setAutoEmoji(null) }}
            className={`w-10 h-10 rounded-xl text-xl transition-all ${
              form.emoji === e
                ? 'bg-brand/20 border border-brand/60 shadow-[0_0_10px_rgba(255,90,38,0.3)]'
                : 'bg-white/[0.03] border border-transparent hover:border-line'
            }`}
          >
            {e}
          </motion.button>
        ))}
      </div>

      {/* Auto-emoji suggestion */}
      <AnimatePresence>
        {activeAutoEmoji && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            aria-label={`Aplicar emoji sugerido: ${activeAutoEmoji}`}
            onClick={applyAutoEmoji}
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-brand/40 bg-brand/[0.07] w-full text-left"
          >
            <Sparkles size={13} className="text-brand flex-shrink-0" aria-hidden="true" />
            <span className="font-mono text-[0.68rem] text-brand font-bold tracking-[0.06em] uppercase">
              {t('meals.autoEmoji')}:
            </span>
            <span className="text-xl">{activeAutoEmoji}</span>
            <span className="ml-auto font-mono text-[0.62rem] text-muted">Aplicar →</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Nome */}
      <label htmlFor="meal-nome" className="sr-only">{t('meals.name')}</label>
      <input
        id="meal-nome"
        aria-required="true"
        value={form.nome}
        onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
        placeholder={t('meals.namePlaceholder', 'Ex: Lasanha, Churrasco…')}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        onFocus={() => setFocusedInput('nome')}
        onBlur={() => setFocusedInput(null)}
        className={inputCls('nome')}
      />

      {/* Tipo — chips */}
      <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase mb-2">
        {t('meals.type')}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {TIPOS.map(({ key, label }) => {
          const active = form.tipo === key
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.93 }}
              aria-pressed={active}
              onClick={() => setForm(f => ({ ...f, tipo: active ? '' : key }))}
              className="px-3.5 py-2 rounded-xl text-[0.8rem] font-medium transition-all border"
              style={active
                ? { background: 'rgba(255,90,38,0.15)', borderColor: 'rgba(255,90,38,0.55)', color: '#ff5a26', boxShadow: '0 0 10px rgba(255,90,38,0.2)' }
                : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(245,245,244,0.55)' }
              }
            >
              {label}
            </motion.button>
          )
        })}
      </div>

      {/* Ingredientes */}
      <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase mb-2">
        {t('meals.ingredients')}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-8">
        {form.ingredientes.map((ing, ii) => (
          <span
            key={`${ing}-${ii}`}
            className="bg-white/[0.04] border border-line rounded-xl px-3 py-1 text-[0.8rem] text-cream/90 flex items-center gap-1.5"
          >
            {ing}
            <button
              onClick={() => removeIng(ii)}
              aria-label={`Remover ${ing}`}
              className="bg-none border-0 p-0 flex text-muted hover:text-brand cursor-pointer transition-colors"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        <label htmlFor="meal-new-ing" className="sr-only">{t('meals.addIngredient')}</label>
        <input
          id="meal-new-ing"
          value={newIng}
          onChange={(e) => setNewIng(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addIng()}
          placeholder={t('meals.addIngredient')}
          onFocus={() => setFocusedInput('newIng')}
          onBlur={() => setFocusedInput(null)}
          className={`flex-1 bg-black/50 border rounded-xl px-4 py-2.5 text-[0.85rem] text-cream outline-none transition-all ${
            focusedInput === 'newIng' ? 'border-brand/60' : 'border-line'
          }`}
        />
        <button
          onClick={addIng}
          aria-label={t('meals.addIngredient')}
          className="px-3.5 flex items-center justify-center rounded-xl bg-brand/20 border border-brand/60 text-brand hover:bg-brand/30 transition-colors"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={submit}
        disabled={!form.nome.trim()}
        className={`w-full py-3.5 rounded-xl font-bold text-[0.92rem] tracking-[0.06em] uppercase flex items-center justify-center gap-2 transition-all ${
          form.nome.trim() ? 'btn-brand' : 'bg-white/[0.06] text-muted cursor-not-allowed'
        }`}
      >
        <Check size={17} aria-hidden="true" /> {t('meals.addMeal')}
      </motion.button>
    </Modal>
  )
}
