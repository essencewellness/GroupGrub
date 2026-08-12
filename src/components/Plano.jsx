import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ESTRUTURA = [
  { id: 'sexta', dia: 'sexta', emoji: '🌆', slots: ['jantar'] },
  { id: 'sabado', dia: 'sabado', emoji: '☀️', slots: ['almoco', 'jantar'] },
  { id: 'domingo', dia: 'domingo', emoji: '🌅', slots: ['almoco', 'lanche'] },
]
const CURSOS = [
  { key: 'entrada', label: 'Entrada', emoji: '🥗' },
  { key: 'principal', label: 'Principal', emoji: '🍽️' },
  { key: 'sobremesa', label: 'Sobremesa', emoji: '🍮' },
]

function slotKey(diaId, slot) {
  return `${diaId}-${slot.toLowerCase().replace(/\s/g, '_')}`
}

function MealPicker({ curso, meals, selectedId, usedIds = new Set(), onSelect }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = meals.find((m) => m.id === selectedId)

  return (
    <div className="mb-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base">{curso.emoji}</span>
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.12em] text-muted">{curso.label}</span>
      </div>

      <motion.div
        whileTap={{ scale: 0.97 }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={`meal-picker-${curso.key}-list`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) } }}
        className={`w-full text-left cursor-pointer rounded-xl border px-3.5 py-2.5 flex items-center gap-2.5 transition-all ${
          selected ? 'border-brand/55 bg-brand/[0.08]' : 'border-line bg-panel'
        }`}
        style={selected ? { boxShadow: '0 2px 16px rgba(255,90,38,0.25)' } : {}}
      >
        {selected ? (
          <>
            <span className="text-xl flex-shrink-0">{selected.emoji}</span>
            <span className="flex-1 font-semibold text-[0.88rem] text-cream">{selected.nome}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5a26')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              onClick={(e) => { e.stopPropagation(); onSelect(null); setOpen(false) }}
              className="text-faint hover:text-brand transition-colors"
              aria-label="Remover seleção"
            >
              <X size={11} />
            </motion.button>
          </>
        ) : (
          <>
            <span className="flex-1 text-[0.8rem] text-muted font-mono uppercase tracking-[0.04em]">{t('meals.selectMeal')}</span>
            <ChevronDown size={14} className="text-muted" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`meal-picker-${curso.key}-list`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1.5 grid gap-1.5">
              {meals.map((meal) => {
                const isSelected = meal.id === selectedId
                const isUsed = !isSelected && usedIds.has(meal.id)
                return (
                  <motion.button
                    key={meal.id}
                    whileTap={{ scale: 0.97 }}
                    whileHover={!isUsed ? { background: 'rgba(255,90,38,0.08)', x: 2 } : {}}
                    onClick={() => { if (!isUsed) { onSelect(meal.id); setOpen(false) } }}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                      isSelected ? 'border-brand/55 bg-brand/[0.12] cursor-pointer' :
                      isUsed ? 'border-line bg-white/[0.02] opacity-50 cursor-not-allowed' :
                      'bg-white/[0.03] border-line cursor-pointer'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{meal.emoji}</span>
                    <div className="flex-1">
                      <div className="text-[0.85rem] font-semibold text-cream">{meal.nome}</div>
                      <div className="text-[0.7rem] text-muted font-mono uppercase tracking-[0.03em]">{meal.tipo}</div>
                    </div>
                    {isSelected && <Check size={14} strokeWidth={3} className="flex-shrink-0 text-brand" />}
                    {isUsed && <span className="text-[0.62rem] font-mono text-muted flex-shrink-0">Já no plano</span>}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlotCard({ diaId, slot, meals, plano, allUsedIds, onUpdate }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const key = slotKey(diaId, slot)
  const selection = plano[key] || {}
  const filled = CURSOS.filter((c) => selection[c.key]).length
  const allFilled = filled === 3

  const slotEmoji = slot === 'jantar' ? '🌙' : slot === 'almoco' ? '☀️' : '🌄'

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.005 }}
      className="surface overflow-hidden transition-all relative"
      style={{ borderColor: allFilled ? 'rgba(52,211,153,0.35)' : open ? 'rgba(255,90,38,0.4)' : undefined, boxShadow: open ? '0 6px 30px rgba(255,90,38,0.12)' : '0 2px 12px rgba(0,0,0,0.4)' }}
    >
      {allFilled && (
        <div
          className="absolute top-2.5 right-11 px-2 py-0.5 flex items-center gap-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.08em] rounded"
          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' }}
        >
          <Check size={11} strokeWidth={3} /> COMPLETO
        </div>
      )}

      <motion.div
        whileTap={{ scale: 0.99 }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={`slot-panel-${key}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v) } }}
        className="p-3.5 sm:p-4 flex items-center gap-3.5 cursor-pointer relative"
      >
        <span className="text-xl flex-shrink-0" style={{ filter: open ? 'drop-shadow(0 0 8px rgba(255,90,38,0.4))' : 'none' }}>{slotEmoji}</span>
        <div className="flex-1">
          <div className="text-base font-bold text-cream uppercase tracking-[0.02em]">{t(`plan.${slot}`)}</div>
          <div className="text-[0.72rem] mt-0.5 font-mono uppercase tracking-[0.03em]" style={{ color: filled === 0 ? 'rgba(245,245,244,0.50)' : '#ff5a26' }}>
            {filled === 0 ? t('meals.noneSelected') : filled === 3 ? t('meals.allCourses') : `${filled} DE 3 ${t('meals.courses').toUpperCase()}`}
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0" aria-hidden="true">
          {CURSOS.map((c) => (
            <div
              key={c.key}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{ background: selection[c.key] ? (allFilled ? '#34d399' : '#ff5a26') : 'rgba(255,90,38,0.08)', boxShadow: selection[c.key] ? `0 0 10px ${allFilled ? 'rgba(52,211,153,0.5)' : 'rgba(255,90,38,0.5)'}` : 'none' }}
            />
          ))}
        </div>

        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="text-muted flex-shrink-0">
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            id={`slot-panel-${key}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-4">
              {CURSOS.map((curso) => {
                const thisSelected = selection[curso.key] || null
                const usedExcludingThis = new Set(
                  [...(allUsedIds || [])].filter(id => id !== thisSelected)
                )
                return (
                  <MealPicker
                    key={curso.key}
                    curso={curso}
                    meals={meals}
                    selectedId={thisSelected}
                    usedIds={usedExcludingThis}
                    onSelect={(mealId) => onUpdate(key, { ...selection, [curso.key]: mealId })}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Plano({ meals, plano, onUpdate, structure }) {
  // Collect all mealIds currently used anywhere in the plan
  const allUsedIds = new Set(
    Object.values(plano).flatMap(sel => Object.values(sel).filter(Boolean))
  )
  const { t } = useTranslation()
  const ESTRUTURA_FINAL = structure && structure.length ? structure : ESTRUTURA
  const allSlotKeys = ESTRUTURA_FINAL.flatMap((dia) => dia.slots.map((slot) => slotKey(dia.id, slot)))
  const totalFilled = allSlotKeys.reduce((acc, key) => {
    const sel = plano[key] || {}
    return acc + CURSOS.filter((c) => sel[c.key]).length
  }, 0)
  const totalPossible = allSlotKeys.length * 3
  const progressPct = totalPossible > 0 ? Math.round((totalFilled / totalPossible) * 100) : 0

  if (!meals || meals.length === 0) {
    return (
      <motion.div
        key="plano-empty"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.24 }}
      >
        <div className="flex flex-col items-center justify-center text-center p-14 surface">
          <span className="text-3xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(255,90,38,0.4))' }}>🍽️</span>
          <div className="font-display text-lg font-bold text-cream mb-2 tracking-tight">{t('trips.empty')}</div>
          <div className="text-[0.82rem] text-muted leading-relaxed max-w-[240px] font-mono uppercase tracking-[0.02em]">
            {t('trips.emptyHint')}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="plano"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.24 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="surface p-5 mb-7"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display text-base font-bold text-brand tracking-tight">{t('plan.title')}</div>
            <div className="text-[0.72rem] text-muted mt-0.5 font-mono uppercase tracking-[0.03em]">
              {totalFilled} DE {totalPossible} {t('plan.coursesPlanned')}
            </div>
          </div>
          <div className="font-display text-2xl font-bold" style={{ color: progressPct === 100 ? '#34d399' : '#ff5a26' }}>
            {progressPct}%
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full"
            style={{
              background: progressPct === 100 ? 'linear-gradient(90deg,#1f8a3a,#34d399)' : 'linear-gradient(90deg,#c8431a,#ff5a26)',
              boxShadow: '0 0 10px rgba(255,90,38,0.4)',
            }}
          />
        </div>
      </motion.div>

      {ESTRUTURA_FINAL.map((dia, di) => {
        const diaFilledSlots = dia.slots.filter((slot) => {
          const sel = plano[slotKey(dia.id, slot)] || {}
          return CURSOS.some((c) => sel[c.key])
        }).length

        return (
          <div key={dia.id} className="mb-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xl" style={{ filter: 'drop-shadow(0 0 6px rgba(255,90,38,0.4))' }}>{dia.emoji}</span>
              <span className="font-display text-lg font-bold text-brand">
                {dia.date
                  ? `${dia.label}, ${dia.date.slice(8, 10)}/${dia.date.slice(5, 7)}`
                  : t(`plan.${dia.id}`)}
              </span>
              {diaFilledSlots > 0 && (
                <div
                  className="px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.06em] rounded"
                  style={{ background: 'rgba(255,90,38,0.1)', border: '1px solid rgba(255,90,38,0.4)', color: '#ff5a26' }}
                >
                  {diaFilledSlots} {t('plan.mealsDefined').toLowerCase()}
                </div>
              )}
              <div className="flex-1 h-px bg-gradient-to-r from-brand/40 to-transparent" />
            </div>

            <div className="grid gap-2">
              {dia.slots.map((slot, si) => (
                <motion.div key={slot} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.08 + si * 0.05 }}>
                  <SlotCard diaId={dia.id} slot={slot} meals={meals} plano={plano} allUsedIds={allUsedIds} onUpdate={onUpdate} />
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}
