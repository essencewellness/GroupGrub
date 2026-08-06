import { useState } from 'react'
import { motion } from 'framer-motion'
import { Receipt, Plus, User, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'

const defaultForm = (pessoas) => ({
  descricao: '',
  valor: '',
  pago_por: pessoas[0] ?? '',
  dividir_por: [...pessoas],
})

export default function AddExpenseModal({ open, onClose, onAdd, pessoas }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(() => defaultForm(pessoas))
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
    setForm(defaultForm(pessoas))
    onClose()
  }

  const isReady = form.descricao.trim() && form.valor && parseFloat(form.valor) > 0 && form.pago_por

  return (
    <Modal open={open} onClose={onClose} title={t('expenses.add', 'NOVA DESPESA')}>
      {/* Descrição */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-1.5 flex items-center gap-1.5">
        <Receipt size={11} />
        {t('expenses.description', 'DESCRIÇÃO')}
      </div>
      <input
        value={form.descricao}
        onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        onFocus={() => setFocusedInput('descricao')}
        onBlur={() => setFocusedInput(null)}
        placeholder={t('expenses.descriptionPlaceholder', 'Ex: Jantar no restaurante')}
        className={inputCls('descricao')}
      />

      {/* Valor */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-1.5 flex items-center gap-1.5">
        <span className="text-[10px]">€</span>
        {t('expenses.amount', 'VALOR')}
      </div>
      <input
        type="number"
        min="0"
        step="0.01"
        value={form.valor}
        onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
        onFocus={() => setFocusedInput('valor')}
        onBlur={() => setFocusedInput(null)}
        placeholder="0.00"
        className={inputCls('valor')}
      />

      {/* Quem pagou */}
      <div className="font-mono text-[0.66rem] font-bold tracking-[0.12em] text-muted uppercase mb-1.5 flex items-center gap-1.5">
        <User size={11} />
        {t('expenses.paidBy', 'QUEM PAGOU?')}
      </div>
      <select
        value={form.pago_por}
        onChange={(e) => setForm((f) => ({ ...f, pago_por: e.target.value }))}
        onFocus={() => setFocusedInput('pago_por')}
        onBlur={() => setFocusedInput(null)}
        className={inputCls('pago_por') + ' appearance-none cursor-pointer'}
      >
        {pessoas.map((p) => (
          <option key={p} value={p} className="bg-[#080A0A]">
            {p}
          </option>
        ))}
      </select>

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
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-mono text-[0.8rem] font-bold tracking-[0.1em] transition-all cursor-pointer ${
          isReady
            ? 'bg-brand text-white shadow-[0_4px_24px_rgba(255,90,38,0.35)]'
            : 'bg-white/[0.06] text-muted cursor-not-allowed'
        }`}
      >
        <Plus size={16} />
        {t('expenses.addExpense', 'ADICIONAR DESPESA')}
      </motion.button>
    </Modal>
  )
}
