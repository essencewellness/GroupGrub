import { motion, useReducedMotion } from 'framer-motion'
import { GUEST_NAME_MAX_LENGTH } from '../lib/constants'

/**
 * Dialog shown once to whoever opens the app without a name saved yet.
 * Keeps App.jsx lean and makes this flow testable in isolation.
 *
 * Props:
 *   guestNameInput  — current value of the controlled input
 *   onInputChange   — (value: string) => void
 *   onConfirm       — () => void  — called when the user submits a valid name
 */
export default function GuestNamePrompt({ guestNameInput, onInputChange, onConfirm }) {
  const shouldReduceMotion = useReducedMotion()
  const canSubmit = !!guestNameInput.trim()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canSubmit) onConfirm()
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-name-title"
      className="fixed inset-0 z-[500] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[340px] rounded-2xl p-7"
        style={{ background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="text-3xl mb-4 text-center" aria-hidden="true">👋</div>
        <h2 id="guest-name-title" className="font-display text-xl font-bold text-cream text-center mb-1">
          Bem-vindo!
        </h2>
        <p className="text-[0.8rem] text-muted text-center mb-5">
          Como te chamas? O teu nome aparece nas despesas e na lista.
        </p>
        <label htmlFor="guest-name-input" className="sr-only">O teu nome</label>
        <input
          id="guest-name-input"
          aria-required="true"
          aria-describedby="guest-name-title"
          value={guestNameInput}
          onChange={e => onInputChange(e.target.value.slice(0, GUEST_NAME_MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="O teu nome"
          autoFocus
          maxLength={GUEST_NAME_MAX_LENGTH}
          className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-cream text-base outline-none mb-4"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canSubmit}
          aria-label="Guardar nome e entrar na lista"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-xl font-bold text-[0.95rem]"
          style={{
            background: canSubmit ? 'linear-gradient(135deg,#c8431a,#D9713C)' : 'rgba(255,255,255,0.06)',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          Entrar na lista →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
