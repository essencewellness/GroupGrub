import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RotateCcw, FileText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATS, CAT_ORDER } from '../lib/constants'
import ShopItem from './ShopItem'
import { exportShoppingList } from '../lib/exportPdf'

export default function ShoppingTab({
  items = [],
  pessoas = [],
  isOwner,
  isGuest,
  isPremium,
  tripId,
  onToggle,
  onRemove,
  onUpdate,
  onAddItem,
  onResetTicks,
  onCategorizarTudo,
  onShowPricing,
  showToast,
}) {
  const { t } = useTranslation()
  const [novoItem, setNovoItem]       = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const [categorizing, setCategorizing] = useState(false)

  const total      = items.length
  const comprados  = items.filter((i) => i.comprado).length
  const pct        = total ? Math.round((comprados / total) * 100) : 0

  const grupos = useMemo(() => {
    const g = {}
    for (const item of items) {
      const cat = item.categoria && item.categoria !== 'desconhecido' ? item.categoria : 'outro'
      if (!g[cat]) g[cat] = []
      g[cat].push(item)
    }
    return g
  }, [items])

  const handleAddItem = async () => {
    const nome = novoItem.trim()
    if (!nome) return
    setNovoItem('')
    await onAddItem(nome)
    showToast(`"${nome}" ${t('common.added')}`)
  }

  return (
    <>
      {/* Progress panel */}
      <div className="surface p-5 mb-4" style={{ background: 'linear-gradient(135deg, #111113 0%, #0e0e10 100%)' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="font-mono text-[0.65rem] tracking-[0.2em] text-faint uppercase mb-1">
              {t('shopping.progress')}
            </div>
            <div className="font-mono text-cream flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {String(comprados).padStart(2, '0')}
              </span>
              <span className="text-faint font-normal text-base">/ {String(total).padStart(2, '0')}</span>
            </div>
          </div>
          <motion.div
            key={pct}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-5xl font-bold leading-none tabular-nums"
            aria-label={`${pct}%`}
            style={{
              color: pct === 100 ? 'rgb(var(--success-rgb))' : 'rgb(var(--brand-rgb))',
              textShadow: pct === 100 ? '0 0 30px rgb(var(--success-rgb) / 0.3)' : '0 0 30px rgb(var(--brand-rgb) / 0.3)',
            }}
          >
            {pct}<span className="text-xl opacity-50" aria-hidden="true">%</span>
          </motion.div>
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            animate={{ width: pct + '%' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{
              background: pct === 100 ? 'linear-gradient(90deg,#1a7a35,#34d399)' : 'linear-gradient(90deg,#c8431a,#ff5a26,#ff7a50)',
              boxShadow: pct === 100 ? '0 0 12px rgba(52,211,153,0.5)' : '0 0 12px rgba(255,90,38,0.5)',
            }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-5">
        {isOwner && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={categorizing}
            aria-busy={categorizing}
            onClick={async () => {
              setCategorizing(true)
              try { await onCategorizarTudo() } finally { setCategorizing(false) }
            }}
            className="flex-1 py-3 rounded-xl border text-xs font-semibold tracking-[0.1em] transition-all"
            style={{
              borderColor: 'rgba(255,90,38,0.55)',
              background: 'rgba(255,90,38,0.11)',
              color: '#ff5a26',
              boxShadow: '0 0 20px rgba(255,90,38,0.18)',
              opacity: categorizing ? 0.6 : 1,
            }}
          >
            {categorizing
              ? <><span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full motion-safe:animate-spin mr-1.5" aria-hidden="true" />{t('shopping.analyzing')}</>
              : <><Sparkles size={13} className="inline mr-1.5" aria-hidden="true" />{t('shopping.recategorize')}</>
            }
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={async () => { await onResetTicks(); showToast(t('shopping.clear')) }}
          aria-label={t('shopping.clear')}
          className="py-3 px-3.5 rounded-xl border border-line bg-white/[0.03] text-muted hover:text-cream transition-colors"
        >
          <RotateCcw size={13} aria-hidden="true" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={async () => {
            if (!isPremium) { onShowPricing?.(); return }
            await exportShoppingList({ tripId, items, pessoas, tripName: 'GroupGrub' })
            showToast(t('common.pdfExported'))
          }}
          className="py-3 px-3.5 rounded-xl border text-xs font-semibold tracking-[0.08em] transition-colors"
          style={{ borderColor: 'rgba(52,211,153,0.32)', background: 'rgba(52,211,153,0.05)', color: '#34d399' }}
        >
          <FileText size={13} className="inline mr-1" aria-hidden="true" /> PDF
        </motion.button>
      </div>

      {/* Grouped items */}
      {CAT_ORDER.filter((cat) => grupos[cat]?.length).map((cat, ci) => {
        const cfg      = CATS[cat]
        const count    = grupos[cat].length
        const doneCount = grupos[cat].filter((i) => i.comprado).length
        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + ci * 0.05 }}
            className="mb-6"
          >
            <div
              className="flex items-center gap-2.5 mb-2.5 px-3 py-2 rounded-lg"
              style={{ borderLeft: `3px solid ${cfg.color}`, background: `${cfg.color}18` }}
            >
              <span className="text-base" aria-hidden="true">{cfg.icon}</span>
              <span
                className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] flex-1"
                style={{ color: cfg.color }}
              >
                {t(`shopping.categories.${cat}`)}
              </span>
              {cfg.desc && <span className="text-[0.65rem] text-muted">{cfg.desc}</span>}
              <span
                className="font-mono text-[0.62rem] font-bold px-2 py-0.5 rounded"
                aria-label={`${doneCount} de ${count} comprados`}
                style={{ background: `${cfg.color}1e`, color: cfg.color, border: `1px solid ${cfg.color}55` }}
              >
                {doneCount}/{count}
              </span>
            </div>
            <div className="grid gap-1.5">
              <AnimatePresence>
                {grupos[cat].map((item) => (
                  <ShopItem
                    key={item.id}
                    item={item}
                    cat={item.categoria || 'outro'}
                    pessoas={pessoas}
                    isOwner={isOwner}
                    onToggle={() => onToggle(item.id)}
                    onRemove={() => onRemove(item.id)}
                    onUpdate={(patch) => onUpdate(item.id, patch)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}

      {/* Add item */}
      {isGuest && (
        <div className="mt-2 px-3.5 py-2.5 rounded-xl border border-line bg-white/[0.02] text-center">
          <span className="font-mono text-[0.65rem] text-faint tracking-[0.1em]">
            Só o organizador pode adicionar itens
          </span>
        </div>
      )}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`flex gap-2.5 items-center p-3.5 rounded-xl border transition-all duration-200 ${
            inputFocused ? 'border-brand/60 bg-brand/[0.06]' : 'border-line bg-panel'
          }`}
          style={{ boxShadow: inputFocused ? '0 0 24px rgba(255,90,38,.2)' : 'none' }}
        >
          <span className="font-mono text-cream/60 text-sm font-bold flex-shrink-0" aria-hidden="true">&gt;</span>
          <input
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={t('shopping.addItem')}
            aria-label={t('shopping.addItem')}
            className="flex-1 bg-transparent border-none outline-none text-base text-cream font-medium placeholder:text-faint"
          />
          <AnimatePresence>
            {novoItem.trim() && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileTap={{ scale: 0.88 }}
                onClick={handleAddItem}
                aria-label="Adicionar item"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand/20 text-brand border border-brand/60"
                style={{ boxShadow: '0 0 16px rgba(255,90,38,.35)' }}
              >
                <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )
}
