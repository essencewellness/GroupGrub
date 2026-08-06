import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, User, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const CATS = {
  duradouro:  { label: 'Duradouro',  icon: '🥫', color: '#f5a623' },
  congelado:  { label: 'Congelado',  icon: '🧊', color: '#3aa0ff' },
  refrigerado:{ label: 'Refrigerado',icon: '🧃', color: '#9b7bff' },
  fresco:     { label: 'Fresco',     icon: '🥦', color: '#34d399' },
  outro:      { label: 'Outro',      icon: '📦', color: '#6b8299' },
}
const CAT_ORDER = ['duradouro', 'fresco', 'refrigerado', 'congelado', 'outro']

export default function ShopItem({ item, cat, onToggle, onRemove, onUpdate, pessoas }) {
  const { t } = useTranslation()
  const [editQtd, setEditQtd]           = useState(false)
  const [editAssignee, setEditAssignee] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const [qtdVal, setQtdVal]             = useState(item.qtd || '')
  const [assigneeVal, setAssigneeVal]   = useState(item.assignee || '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveQtd      = () => { onUpdate({ qtd: qtdVal }); setEditQtd(false) }
  const saveAssignee = (val) => { onUpdate({ assignee: val }); setEditAssignee(false) }

  const catKey   = cat || item.categoria || 'outro'
  const catCfg   = CATS[catKey] || CATS.outro
  const isUncat  = catKey === 'outro'
  const borderColor = item.comprado ? '#34d399' : catCfg.color

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: item.comprado ? 0.55 : 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative rounded-xl border border-line bg-panel"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {!confirmDelete ? (
        <>
          <div className="flex items-center gap-3 px-3.5 py-3">
            {/* Checkbox */}
            <motion.div
              whileTap={{ scale: 1.2 }}
              onClick={onToggle}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
              className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all cursor-pointer"
              style={{
                background: item.comprado ? '#34d399' : 'transparent',
                border: item.comprado ? 'none' : '2px solid rgba(255,255,255,0.2)',
                boxShadow: item.comprado ? '0 0 12px rgba(52,211,153,0.5)' : 'none',
              }}
            >
              <AnimatePresence>
                {item.comprado && (
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <Check size={14} color="#000" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Nome */}
            <span
              className="flex-1 font-semibold text-[0.95rem] transition-all"
              style={{
                color: item.comprado ? '#34d399' : '#f5f5f4',
                textDecoration: item.comprado ? 'line-through' : 'none',
                opacity: item.comprado ? 0.7 : 1,
              }}
            >
              {item.nome}
            </span>

            {/* Badges inline */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {item.assignee && item.assignee !== '—' && (
                <span
                  className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,90,38,0.15)', color: '#ff5a26', border: '1px solid rgba(255,90,38,0.35)' }}
                >
                  {item.assignee}
                </span>
              )}

              {item.antecipado && !item.comprado && (
                <span
                  className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.06em] px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.25)' }}
                >
                  ANT.
                </span>
              )}

              {/* QTD */}
              {editQtd ? (
                <input
                  autoFocus
                  value={qtdVal}
                  onChange={(e) => setQtdVal(e.target.value)}
                  onBlur={saveQtd}
                  onKeyDown={(e) => e.key === 'Enter' && saveQtd()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 bg-black/50 border border-brand/60 rounded-lg px-2 py-1 text-cream font-mono text-[0.75rem] outline-none text-center"
                />
              ) : (
                <span
                  onClick={(e) => { e.stopPropagation(); setEditQtd(true) }}
                  className="font-mono text-[0.68rem] text-muted border-b border-dashed border-line cursor-text pb-0.5 min-w-[18px] text-center"
                >
                  {item.qtd || t('shopping.qty')}
                </span>
              )}

              {/* Assign user */}
              {pessoas && pessoas.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditAssignee(v => !v); setShowCatPicker(false) }}
                  className="p-1 cursor-pointer text-muted hover:text-brand transition-colors"
                  title={t('shopping.assign')}
                >
                  <User size={11} />
                </button>
              )}

              {/* Delete */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                className="p-1 text-muted hover:text-brand transition-colors"
              >
                <Trash2 size={13} />
              </motion.button>
            </div>
          </div>

          {/* Category selector trigger — full width, slides down inline */}
          {isUncat && (
            <button
              type="button"
              onClick={() => { setShowCatPicker(v => !v); setEditAssignee(false) }}
              className="w-full flex items-center justify-between px-3.5 pb-2.5 group"
            >
              <span
                className="flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.1em] transition-colors"
                style={{ color: showCatPicker ? '#ff5a26' : 'rgba(255,90,38,0.7)' }}
              >
                <span className="inline-block w-3 h-3 rounded-full border-2 border-current animate-pulse" />
                {t('shopping.uncategorized')}
              </span>
              <motion.div
                animate={{ rotate: showCatPicker ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-muted/60 group-hover:text-muted"
              >
                <ChevronDown size={12} />
              </motion.div>
            </button>
          )}

          {/* Inline category picker */}
          <AnimatePresence>
            {showCatPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden border-t border-white/[0.06]"
              >
                <div className="px-2 py-2 grid grid-cols-5 gap-1">
                  {CAT_ORDER.map((k) => {
                    const c = CATS[k]
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          onUpdate({ categoria: k, antecipado: ['duradouro', 'congelado'].includes(k) })
                          setShowCatPicker(false)
                        }}
                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all hover:bg-white/[0.06] active:scale-95"
                        style={{ border: `1px solid ${c.color}30` }}
                      >
                        <span className="text-base">{c.icon}</span>
                        <span className="font-mono text-[0.54rem] font-bold uppercase tracking-[0.04em]" style={{ color: c.color }}>
                          {c.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inline assignee picker */}
          <AnimatePresence>
            {editAssignee && pessoas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-white/[0.06]"
              >
                <div className="px-2.5 py-2 flex gap-1.5 flex-wrap">
                  {pessoas.map((p) => (
                    <button
                      key={p}
                      onClick={() => saveAssignee(p)}
                      className="px-3 py-1.5 rounded-lg font-mono text-[0.72rem] uppercase tracking-[0.04em] border transition-colors"
                      style={
                        assigneeVal === p
                          ? { background: 'rgba(255,90,38,0.15)', borderColor: 'rgba(255,90,38,0.5)', color: '#ff5a26' }
                          : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: '#8a9baa' }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 p-3.5">
          <span className="font-mono text-[0.8rem] font-bold text-brand flex-1 uppercase tracking-[0.03em] truncate">
            {t('shopping.confirmRemove')} "{item.nome}"?
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="px-3 py-1.5 rounded-lg bg-brand text-black font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] flex-shrink-0"
          >
            {t('shopping.remove')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1.5 rounded-lg border border-line bg-white/[0.03] text-muted font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em] flex-shrink-0"
          >
            ✕
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
