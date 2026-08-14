import { motion, useReducedMotion } from 'framer-motion'

/**
 * Shown once, right after a new person gives their name, if the trip already
 * has expenses — asks whether they want to be included in splitting those
 * (instead of silently only joining future expenses, or silently being added
 * to every past expense without being asked).
 */
export default function JoinExpensesPrompt({ count, onJoin, onSkip }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-expenses-title"
      className="fixed inset-0 z-[500] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[340px] rounded-2xl p-7"
        style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="text-3xl mb-4 text-center" aria-hidden="true">🧾</div>
        <h2 id="join-expenses-title" className="font-display text-xl font-bold text-cream text-center mb-1">
          Já há despesas nesta viagem
        </h2>
        <p className="text-[0.8rem] text-muted text-center mb-6">
          {count === 1
            ? 'Já foi registada 1 despesa. Queres entrar na divisão dela?'
            : `Já foram registadas ${count} despesas. Queres entrar na divisão delas?`}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onJoin}
          className="w-full py-3.5 rounded-xl font-bold text-[0.95rem] mb-2.5"
          style={{ background: 'linear-gradient(135deg,#c8431a,#D9713C)', color: '#fff' }}
        >
          Sim, incluir-me
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSkip}
          className="w-full py-3 rounded-xl font-bold text-[0.85rem]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,245,244,0.7)' }}
        >
          Não, só nas seguintes
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
