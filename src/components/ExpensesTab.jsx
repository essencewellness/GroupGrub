import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Trash2, Share2, Plus, ArrowRight, Check, UserPlus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { calculateSettlement, formatSettlementWA } from '../lib/expenseSplitter'
import AddExpenseModal from './AddExpenseModal'

export default function ExpensesTab({ expenses = [], pessoas = [], onAddExpense, onRemoveExpense, onAddPessoa, onRemovePessoa, isOwner = false, currentUser = '' }) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [shared, setShared] = useState(false)
  const [newPessoa, setNewPessoa] = useState('')

  const totalGasto = useMemo(
    () => expenses.reduce((sum, e) => sum + (parseFloat(e.valor) || 0), 0),
    [expenses]
  )
  const { settlements, saldos } = useMemo(
    () => calculateSettlement(expenses, pessoas),
    [expenses, pessoas]
  )
  const allParticipants = useMemo(() => [...new Set([
    ...pessoas,
    ...expenses.map(e => e.pago_por).filter(Boolean),
    ...expenses.flatMap(e => e.dividir_por || []),
  ])], [expenses, pessoas])

  const sharedTimerRef = useRef(null)
  useEffect(() => () => clearTimeout(sharedTimerRef.current), [])

  const handleShare = () => {
    const text = formatSettlementWA(settlements)
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setShared(true)
    clearTimeout(sharedTimerRef.current)
    sharedTimerRef.current = setTimeout(() => setShared(false), 2500)
  }

  return (
    <div className="pb-32 pt-2 space-y-4">

      {/* ── HUD — Estatísticas Agregadas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        {/* Total Gasto */}
        <div
          className="col-span-3 rounded-2xl border border-line bg-black/40 p-5"
          style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.4)' }}
        >
          <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase mb-1">
            {t('expenses.totalSpent', 'TOTAL GASTO')}
          </div>
          <div
            className="text-[2.6rem] font-bold text-cream leading-none"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {totalGasto.toFixed(2)}
            <span className="text-brand text-[1.4rem] ml-1">€</span>
          </div>
          <div className="font-mono text-[0.62rem] text-muted mt-1">
            {expenses.length} {t('expenses.entries', 'despesas')} · {allParticipants.length} {t('expenses.people', 'pessoas')}
          </div>
        </div>

        {/* Quota individual */}
        {allParticipants.length > 0 && (
          <div className="col-span-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-black/30 px-4 py-3.5">
              <div className="font-sans text-[0.65rem] font-bold tracking-[0.1em] text-muted uppercase mb-1">
                {t('expenses.quotaPerPerson', 'QUOTA/PESSOA')}
              </div>
              <div
                className="text-[1.45rem] font-bold leading-none tabular-nums"
                style={{ fontFamily: '"JetBrains Mono", monospace', color: '#34d399' }}
              >
                {(totalGasto / allParticipants.length).toFixed(2)}<span className="text-[0.9rem] ml-0.5 opacity-70">€</span>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-black/30 px-4 py-3.5">
              <div className="font-sans text-[0.65rem] font-bold tracking-[0.1em] text-muted uppercase mb-1">
                {t('expenses.participants', 'PARTICIPANTES')}
              </div>
              <div
                className="text-[1.45rem] font-bold text-cream leading-none tabular-nums"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {allParticipants.length}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Balanço por Membro ── */}
      {pessoas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl border border-line bg-black/40 p-5"
        >
          <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase mb-3.5">
            📊 BALANÇO POR MEMBRO
          </div>
          <div className="space-y-2.5">
            {allParticipants.map((p) => {
              const bal = saldos[p] ?? 0
              const isPos = bal > 0.005
              const isNeg = bal < -0.005
              const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus
              const color = isPos ? '#34d399' : isNeg ? '#EB5757' : '#6b8299'
              const bgColor = isPos ? 'rgba(52,211,153,0.07)' : isNeg ? 'rgba(235,87,87,0.07)' : 'rgba(255,255,255,0.03)'
              const borderColor = isPos ? 'rgba(52,211,153,0.2)' : isNeg ? 'rgba(235,87,87,0.2)' : 'rgba(255,255,255,0.06)'
              return (
                <div
                  key={p}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
                  style={{ background: bgColor, border: `1px solid ${borderColor}` }}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color, flexShrink: 0 }} />
                    <span className="font-mono text-[0.82rem] text-cream font-medium">{p}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-[0.88rem] font-bold tabular-nums"
                      style={{ color, fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {isPos ? '+' : ''}{bal.toFixed(2)}€
                    </span>
                    <span
                      className="font-mono text-[0.65rem] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
                    >
                      {isPos ? 'a receber' : isNeg ? 'a pagar' : 'acertado'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── Transferências Recomendadas ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-line bg-black/40 p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase">
            {t('expenses.settlements', 'TRANSFERÊNCIAS')}
          </div>
          {settlements.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[0.66rem] font-bold cursor-pointer transition-all"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.28)', color: '#25D366' }}
            >
              {shared ? <Check size={11} /> : <Share2 size={11} />}
              {shared ? t('expenses.shared', 'ENVIADO!') : 'WhatsApp'}
            </motion.button>
          )}
        </div>

        {settlements.length === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <Check size={15} className="text-success" aria-hidden="true" />
            <span className="font-mono text-[0.78rem] text-success">
              {t('expenses.allSettled', 'Tudo acertado! 🎉')}
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
                  className="rounded-xl border border-line bg-white/[0.025] px-4 py-3"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted">
                      AÇÃO RECOMENDADA
                    </span>
                    <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-brand">
                      PASSO {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[0.82rem]">
                      <span className="text-cream font-bold">{s.de}</span>
                      <ArrowRight size={12} className="text-brand flex-shrink-0" />
                      <span className="text-cream font-bold">{s.para}</span>
                    </div>
                    <span
                      className="font-bold text-[0.95rem] text-brand tabular-nums"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {s.valor.toFixed(2)}€
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Pessoas na viagem ── */}
      <div className="rounded-2xl border border-line bg-black/40 p-5">
        <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase mb-3">
          👥 PESSOAS NA VIAGEM
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {pessoas.length === 0 && (
            <span className="text-[0.74rem] text-faint font-mono">Nenhuma pessoa adicionada ainda.</span>
          )}
          {pessoas.map(p => (
            <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-line text-[0.8rem] text-cream font-mono">
              {p}
              {isOwner && (
                <button onClick={() => onRemovePessoa?.(p)} aria-label={`Remover ${p}`} className="w-5 h-5 flex items-center justify-center text-muted hover:text-brand transition-colors ml-0.5 -mr-1">
                  <X size={11} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <label htmlFor="expenses-add-person" className="sr-only">Adicionar pessoa</label>
            <input
              id="expenses-add-person"
              value={newPessoa}
              onChange={e => setNewPessoa(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newPessoa.trim()) {
                  onAddPessoa?.(newPessoa.trim())
                  setNewPessoa('')
                }
              }}
              placeholder="Adicionar pessoa…"
              className="flex-1 bg-black/50 border border-line rounded-xl px-3.5 py-2 text-base text-cream outline-none focus:border-brand/50 transition-colors"
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              aria-label="Adicionar pessoa"
              onClick={() => {
                if (newPessoa.trim()) {
                  onAddPessoa?.(newPessoa.trim())
                  setNewPessoa('')
                }
              }}
              className="px-3.5 rounded-xl bg-brand/20 border border-brand/50 text-brand"
            >
              <UserPlus size={15} aria-hidden="true" />
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Botão nova despesa ── */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white font-mono text-[0.8rem] font-bold tracking-[0.1em] cursor-pointer transition-all"
        style={{ boxShadow: '0 4px 24px rgba(255,90,38,0.35)' }}
      >
        <Plus size={16} aria-hidden="true" />
        {t('expenses.new', 'NOVA DESPESA')}
      </motion.button>

      {/* ── Histórico ── */}
      {expenses.length > 0 && (
        <div>
          <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase mb-2.5 flex items-center gap-1.5">
            <Receipt size={11} aria-hidden="true" />
            {t('expenses.history', 'HISTÓRICO')}
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {[...expenses].reverse().map((exp, i) => (
                <motion.div
                  key={exp.id}
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
                      <span className="px-2 py-0.5 rounded bg-brand/15 border border-brand/30 text-brand font-mono text-[0.6rem] font-bold">
                        {exp.pago_por}
                      </span>
                      {exp.dividir_por?.length > 0 && exp.dividir_por.length < pessoas.length && (
                        <span className="text-muted font-mono text-[0.6rem]">
                          ÷ {exp.dividir_por.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span
                      className="font-bold text-[1rem] text-cream tabular-nums"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {parseFloat(exp.valor).toFixed(2)}€
                    </span>
                    {isOwner && (
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        aria-label={`Remover despesa ${exp.descricao}`}
                        onClick={() => onRemoveExpense?.(exp.id ?? i)}
                        className="p-2.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AddExpenseModal
        key={modalOpen ? 'open' : 'closed'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(expense) => {
          onAddExpense?.(expense)
          setModalOpen(false)
        }}
        pessoas={pessoas}
        currentUser={currentUser}
      />
    </div>
  )
}
