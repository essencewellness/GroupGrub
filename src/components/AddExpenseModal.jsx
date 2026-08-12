import { useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'

const defaultForm = (pessoas, currentUser) => {
  // Always include the current user in the split, even if they're not in pessoas yet
  const all = currentUser && !pessoas.includes(currentUser)
    ? [currentUser, ...pessoas]
    : [...pessoas]
  return {
    descricao: '',
    valor: '',
    pago_por: currentUser || pessoas[0] || '',
    dividir_por: all.length > 0 ? all : currentUser ? [currentUser] : [],
  }
}

export default function AddExpenseModal({ open, onClose, onAdd, pessoas, currentUser }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => defaultForm(pessoas, currentUser))
  const [focusedInput, setFocusedInput] = useState(null)

  const inputCls = (name) =>
    `w-full bg-black/50 border px-4 py-3 rounded-xl text-cream font-mono text-[1rem] outline-none transition-all mb-2.5 ${
      focusedInput === name
        ? 'border-brand/60 shadow-[0_0_0_2px_rgba(255,90,38,0.3)]'
        : 'border-line'
    }`

  const togglePessoa = (pessoa) => {
    setForm((f) => {
      const already = f.dividir_por.includes(pessoa)
      if (already && f.dividir_por.length === 1) return f // precisa de pelo menos 1
      return {
        ...f,
        dividir_por: already
          ? f.dividir_por.filter((p) => p !== pessoa)
          : [...f.dividir_por, pessoa],
      }
    })
  }

  const submit = () => {
    if (!form.descricao.trim() || !form.valor || !form.pago_por) return
    onAdd({ ...form, valor: parseFloat(form.valor) })
    setForm(defaultForm(pessoas, currentUser))
    onClose()
  }

  const isReady = form.descricao.trim() && form.valor && parseFloat(form.valor) > 0 && form.pago_por

  return (
    <Modal open={open} onClose={onClose} title={t('expenses.add', 'NOVA DESPESA')}>
      {/* Descrição */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-1.5 flex items-center gap-1.5">
        <Receipt size={11} aria-hidden="true" />
        {t('expenses.description', 'DESCRIÇÃO')}
      </div>
      <label htmlFor="expense-descricao" className="sr-only">{t('expenses.description', 'Descrição')}</label>
      <input
        id="expense-descricao"
        aria-required="true"
        value={form.descricao}
        onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        onFocus={() => setFocusedInput('descricao')}
        onBlur={() => setFocusedInput(null)}
        placeholder={t('expenses.descriptionPlaceholder', 'Ex: Jantar no restaurante')}
        className={inputCls('descricao')}
      />

      {/* Valor */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-1.5 flex items-center gap-1.5">
        <span className="text-[10px]" aria-hidden="true">€</span>
        {t('expenses.amount', 'VALOR')}
      </div>
      <label htmlFor="expense-valor" className="sr-only">{t('expenses.amount', 'Valor em euros')}</label>
      <input
        id="expense-valor"
        aria-required="true"
        type="text"
        inputMode="decimal"
        value={form.valor}
        onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value.replace(/[^0-9.,]/g, '') }))}
        onFocus={() => setFocusedInput('valor')}
        onBlur={() => setFocusedInput(null)}
        placeholder="0.00"
        className={inputCls('valor')}
      />

      {/* Dividir por */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-2 flex items-center gap-1.5">
        <Users size={11} />
        {t('expenses.splitBy', 'DIVIDIR POR')}
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {pessoas.map((p) => {
          const selected = form.dividir_por.includes(p)
          return (
            <motion.button
              key={p}
              whileTap={{ scale: 0.92 }}
              aria-pressed={selected}
              onClick={() => togglePessoa(p)}
              className={`px-3 py-1.5 rounded-lg text-[0.75rem] font-mono font-bold border transition-all cursor-pointer ${
                selected
                  ? 'bg-brand/20 border-brand/60 text-brand'
                  : 'bg-white/[0.03] border-line text-muted'
              }`}
            >
              {p}
            </motion.button>
          )
        })}
      </div>

      {/* Botão submit */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={submit}
        disabled={!isReady}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono text-[0.8rem] font-bold tracking-[0.1em] transition-all ${
          isReady
            ? 'bg-brand text-white shadow-[0_4px_24px_rgba(255,90,38,0.35)] cursor-pointer'
            : 'bg-white/[0.06] text-muted cursor-not-allowed'
        }`}
      >
        <Plus size={16} aria-hidden="true" />
        {t('expenses.addExpense', 'ADICIONAR DESPESA')}
      </motion.button>
    </Modal>
  )
}
