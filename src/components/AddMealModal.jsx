import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'

const EMOJIS = ['🍽️', '🫕', '🔥', '🐟', '🥩', '🌅', '🥤', '🥗', '🍳', '🥘', '🍖', '🥪', '🍕', '🥙', '🫙']

export default function AddMealModal({ open, onClose, onAdd }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
  const [newIng, setNewIng] = useState('')
  const [focusedInput, setFocusedInput] = useState(null)

  const addIng = () => { if (newIng.trim()) { setForm((f) => ({ ...f, ingredientes: [...f.ingredientes, newIng.trim()] })); setNewIng('') } }
  const removeIng = (i) => setForm((f) => ({ ...f, ingredientes: f.ingredientes.filter((_, ii) => ii !== i) }))

  const submit = () => {
    if (!form.nome.trim()) return
    onAdd(form)
    setForm({ emoji: '🍽️', nome: '', tipo: '', ingredientes: [] })
    onClose()
  }

  const inputCls = (name) =>
    `w-full bg-black/50 border px-4 py-3 rounded-xl text-cream font-mono text-[1rem] outline-none transition-all mb-2.5 ${
      focusedInput === name ? 'border-brand/60 shadow-[0_0_0_2px_rgba(255,90,38,0.3)]' : 'border-line'
    }`

  const isReady = form.nome.trim()

  return (
    <Modal open={open} onClose={onClose} title={t('meals.add')}>
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-2">{t('meals.chooseEmoji')}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {EMOJIS.map((e) => (
          <motion.button
            key={e}
            onClick={() => setForm((f) => ({ ...f, emoji: e }))}
            className={`w-10 h-10 rounded-lg text-lg cursor-pointer transition-all ${
              form.emoji === e ? 'bg-brand/20 border border-brand/60' : 'bg-white/[0.03] border border-transparent'
            }`}
          >
            {e}
          </motion.button>
        ))}
      </div>

      <input
        value={form.nome}
        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        placeholder={t('meals.name')}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        onFocus={() => setFocusedInput('nome')}
        onBlur={() => setFocusedInput(null)}
        className={inputCls('nome')}
      />

      <input
        value={form.tipo}
        onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
        placeholder={t('meals.type')}
        onFocus={() => setFocusedInput('tipo')}
        onBlur={() => setFocusedInput(null)}
        className={inputCls('tipo')}
      />

      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-2">{t('meals.ingredients')}</div>
      <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-8">
        {form.ingredientes.map((ing, ii) => (
          <span
            key={ii}
            className="bg-white/[0.04] border border-line rounded-xl px-3 py-1 text-[0.8rem] text-cream/90 flex items-center gap-1.5"
          >
            {ing}
            <button
              onClick={() => removeIng(ii)}
              className="bg-none border-0 p-0 flex text-muted hover:text-brand cursor-pointer transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        <input
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
          className="px-3.5 flex items-center justify-center rounded-xl bg-brand/20 border border-brand/60 text-brand"
        >
          <Plus size={16} />
        </button>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={submit}
        disabled={!isReady}
        className={`w-full py-3.5 rounded-xl font-bold text-[0.92rem] tracking-[0.06em] uppercase flex items-center justify-center gap-2 transition-all ${
          isReady ? 'btn-brand' : 'bg-white/[0.06] text-muted cursor-not-allowed'
        }`}
      >
        <Check size={17} /> {t('meals.addMeal')}
      </motion.button>
    </Modal>
  )
}
