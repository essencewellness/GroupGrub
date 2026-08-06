import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Trash2, User, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const CAT_COLORS = {
  duradouro: '#f5a623',
  congelado: '#3aa0ff',
  refrigerado: '#9b7bff',
  fresco: '#34d399',
  outro: 'rgba(255,90,38,0.55)',
  desconhecido: 'rgba(255,90,38,0.75)', // item sem categoria → colore para chamar atenção
}

// Map de labels PT para as opções do selector
const CAT_LABELS = {
  duradouro: 'Duradouro',
  congelado: 'Congelado',
  refrigerado: 'Refrigerado',
  fresco: 'Fresco',
  outro: 'Outro',
  desconhecido: 'Sem categoria',
}

const CAT_OPTIONS = ['duradouro', 'congelado', 'refrigerado', 'fresco', 'outro']

export default function ShopItem({ item, cat, onToggle, onRemove, onUpdate, pessoas }) {
  const { t } = useTranslation()
  const [editQtd, setEditQtd] = useState(false)
  const [editAssignee, setEditAssignee] = useState(false)
  const [qtdVal, setQtdVal] = useState(item.qtd || '')
  const [assigneeVal, setAssigneeVal] = useState(item.assignee || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)

  const saveQtd = () => { onUpdate({ qtd: qtdVal }); setEditQtd(false) }
  const saveAssignee = () => { onUpdate({ assignee: assigneeVal }); setEditAssignee(false) }

  const catKey = cat || item.categoria || 'outro'
  const catColor = CAT_COLORS[catKey] || CAT_COLORS.outro
  const borderColor = item.comprado ? '#34d399' : catColor

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: item.comprado ? 0.55 : 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="surface overflow-hidden"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: item.comprado ? '0 0 16px rgba(52,211,153,0.3)' : '0 0 14px rgba(0,0,0,0.4)',
      }}
    >
      {!confirmDelete ? (
        <div className="flex items-center gap-3 p-3.5 cursor-pointer" onClick={onToggle}>
          <motion.div
            whileTap={{ scale: 1.2 }}
            className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all"
            style={{
              background: item.comprado ? '#34d399' : 'transparent',
              border: item.comprado ? 'none' : '2px solid rgba(255,255,255,0.2)',
              boxShadow: item.comprado ? '0 0 12px rgba(52,211,153,0.5)' : 'none',
              animation: item.comprado ? 'checkPop 0.4s ease' : 'none',
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

          {item.assignee && item.assignee !== '—' && (
            <span
              className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,90,38,0.15)', color: '#ff5a26', border: '1px solid rgba(255,90,38,0.4)' }}
            >
              <User size={8} className="inline mr-1" />
              {item.assignee}
            </span>
          )}

          {(catKey === 'desconhecido' || catKey === 'outro') && (
            <span
              className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,90,38,0.25)', color: '#ff5a06', border: '1px solid rgba(255,90,38,0.5)' }}
              title={t('shopping.uncategorizedHint')}
            >
              ⚠ {t('shopping.uncategorized')}</span>
          )}
          {(catKey === 'desconhecido' || catKey === 'outro') && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCatPicker(v => !v) }}
              className="p-1 rounded text-muted hover:text-white hover:bg-white/10 transition-colors"
              title={t('shopping.changeCategory')}
            >
              <Tag size={11} />
            </button>
          )}

          {editQtd ? (
            <input
              autoFocus
              value={qtdVal}
              onChange={(e) => setQtdVal(e.target.value)}
              onBlur={saveQtd}
              onKeyDown={(e) => e.key === 'Enter' && saveQtd()}
              onClick={(e) => e.stopPropagation()}
              className="w-20 bg-black/50 border border-brand/60 rounded-lg px-2 py-1 text-cream font-mono text-[0.78rem] outline-none text-center"
            />
          ) : (
            <span
              onClick={(e) => { e.stopPropagation(); setEditQtd(true) }}
              className="font-mono text-[0.7rem] text-muted border-b border-dashed border-line cursor-text pb-0.5 min-w-[20px] text-center"
            >
              {item.qtd || t('shopping.qty')}
            </span>
          )}

          {pessoas && pessoas.length > 1 && (
            <span
              onClick={(e) => { e.stopPropagation(); setEditAssignee(true) }}
              className="p-1 cursor-pointer text-muted hover:text-brand transition-colors"
              title={t('shopping.assign')}
            >
              <User size={11} />
            </span>
          )}

          {item.antecipado && !item.comprado && (
            <span
              className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded"
              style={{ background: 'rgba(245,166,35,0.15)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' }}
            >
              <Check size={9} strokeWidth={3} className="inline mr-0.5" /> {t('shopping.antecipado')}
            </span>
          )}

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            className="p-1 text-muted hover:text-brand transition-colors"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5 p-3.5">
          <span className="font-mono text-[0.82rem] font-bold text-brand flex-1 uppercase tracking-[0.03em]">
            {t('shopping.confirmRemove')} "{item.nome}"?
          </span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="px-3.5 py-1.5 rounded-lg bg-brand text-black font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]"
          >
            {t('shopping.remove')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setConfirmDelete(false)}
            className="px-3.5 py-1.5 rounded-lg border border-line bg-white/[0.03] text-muted font-mono text-[0.72rem] font-bold uppercase tracking-[0.08em]"
          >
            {t('pricing.cancel')}
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {editAssignee && pessoas && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 p-2.5 flex gap-1.5 flex-wrap border-t border-line"
          >
            {pessoas.map((p) => (
              <button
                key={p}
                onClick={(e) => {
                  e.stopPropagation()
                  setAssigneeVal(p)
                  saveAssignee()
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-[0.74rem] uppercase tracking-[0.04em] border transition-colors ${
                  assigneeVal === p ? 'bg-brand/20 border-brand/60 text-brand' : 'bg-white/[0.03] border-line text-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCatPicker && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full right-0 mt-1 z-10 flex gap-1 bg-[#121212] border border-white/20 rounded-lg p-1 shadow-lg shadow-black/50"
          >
            {CAT_OPTIONS.map((catKeyOpt) => (
              <button
                key={catKeyOpt}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onUpdate({ categoria: catKeyOpt, antecipado: ['duradouro', 'congelado'].includes(catKeyOpt) })
                  setShowCatPicker(false)
                }}
                className="font-mono text-[0.62rem] uppercase tracking-[0.04em] px-2 py-1 rounded whitespace-nowrap transition-colors"
                style={{ color: CAT_COLORS[catKeyOpt] }}
                title={catKeyOpt}
              >
                {CAT_LABELS[catKeyOpt]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes checkPop {
          0%   { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50%  { box-shadow: 0 0 0 8px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 12px rgba(52,211,153,0.5); }
        }
      `}</style>
    </motion.div>
  )
}
