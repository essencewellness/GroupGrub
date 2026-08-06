import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Trash2, Share2, Plus, ArrowRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { calculateSettlement, formatSettlementWA } from '../lib/expenseSplitter'
import AddExpenseModal from './AddExpenseModal'

export default function ExpensesTab({ expenses = [], pessoas = [], onAddExpense, onRemoveExpense }) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [shared, setShared] = useState(false)

  const totalGasto = expenses.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0)
  const { settlements } = calculateSettlement(expenses, pessoas)

  const handleShare = () => {
    const text = formatSettlementWA(settlements)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    setShared(true)
    setTimeout(() => setShared(false), 2500)
  }

  return (
    <div className="px-4 pb-32 pt-2 space-y-4">
      {/* HUD — Total Gasto */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-line bg-black/40 p-5"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.4)' }}
      >
        <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase mb-1">
          {t('expenses.totalSpent', 'TOTAL GASTO')}
        </div>
        <div
          className="text-[2.6rem] font-bold text-cream leading-none"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          {totalGasto.toFixed(2)}
          <span className="text-brand text-[1.4rem] ml-1">€</span>
        </div>
        <div className="font-mono text-[0.66rem] text-muted mt-1">
          {expenses.length} {t('expenses.entries', 'despesas')} · {pessoas.length} {t('expenses.people', 'pessoas')}
        </div>
      </motion.div>

      {/* Transferências Recomendadas */}
      <div className="rounded-2xl border border-line bg-black/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase">
            {t('expenses.settlements', 'TRANSFERÊNCIAS')}
          </div>
          {settlements.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-mono text-[0.68rem] font-bold cursor-pointer transition-all"
            >
              {shared ? <Check size={12} /> : <Share2 size={12} />}
              {shared ? t('expenses.shared', 'ENVIADO!') : 'WhatsApp'}
            </motion.button>
          )}
        </div>

        {settlements.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <Check size={16} className="text-[#00C853]" />
            <span className="font-mono text-[0.8rem] text-[#00C853]">
              {t('expenses.allSettled', 'Tudo acertado!')}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {settlements.map((s, i) => (
                <motion.div
                  key={`${s.de}-${s.para}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between bg-white/[0.03] border border-line rounded-xl px-4 py-2.5"
                >
                  <div className="flex items-center gap-2 font-mono text-[0.8rem]">
                    <span className="text-cream font-bold">{s.de}</span>
                    <ArrowRight size={12} className="text-brand" />
                    <span className="text-cream font-bold">{s.para}</span>
                  </div>
                  <span
                    className="font-bold text-[0.9rem] text-brand"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {s.valor.toFixed(2)}€
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Botão nova despesa */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white font-mono text-[0.8rem] font-bold tracking-[0.1em] cursor-pointer shadow-[0_4px_24px_rgba(255,90,38,0.35)] transition-all"
      >
        <Plus size={16} />
        {t('expenses.new', 'NOVA DESPESA')}
      </motion.button>

      {/* Histórico */}
      {expenses.length > 0 && (
        <div>
          <div className="font-mono text-[0.62rem] font-bold tracking-[0.14em] text-muted uppercase mb-2.5 flex items-center gap-1.5">
            <Receipt size={11} />
            {t('expenses.history', 'HISTÓRICO')}
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {[...expenses].reverse().map((exp, i) => (
                <motion.div
                  key={exp.id ?? i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.18 } }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between bg-white/[0.03] border border-line rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.85rem] text-cream font-bold truncate">
                      {exp.descricao}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded bg-brand/15 border border-brand/30 text-brand font-mono text-[0.62rem] font-bold">
                        {exp.pago_por}
                      </span>
                      {exp.dividir_por?.length && exp.dividir_por.length < pessoas.length && (
                        <span className="text-muted font-mono text-[0.62rem]">
                          ÷ {exp.dividir_por.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span
                      className="font-bold text-[1rem] text-cream"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {parseFloat(exp.valor).toFixed(2)}€
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onRemoveExpense?.(exp.id ?? i)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Modal */}
      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(expense) => {
          onAddExpense?.(expense)
          setModalOpen(false)
        }}
        pessoas={pessoas}
      />
    </div>
  )
}
