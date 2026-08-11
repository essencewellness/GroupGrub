import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Sparkles, Lock } from 'lucide-react'

const FEATURES_FREE = [
  '1 viagem activa',
  'Lista de compras ilimitada',
  'Plano de refeições',
  'Partilha por link',
  'Sync em tempo real',
]

const FEATURES_PRO = [
  'Viagens ilimitadas',
  'Histórico de viagens',
  'Duplicar viagens',
  'Exportar lista em PDF',
  'Tudo do plano Free',
]

export default function Pricing({ onClose, tripId, onSuccess }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, customerEmail: email || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Erro ao iniciar pagamento.')
      }
    } catch {
      setError('Sem ligação. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[440px] bg-[#080A0A] border border-white/10 rounded-[28px] p-7 relative"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgb(var(--brand-rgb) / 0.08)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 text-muted hover:text-cream transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <Sparkles size={20} className="text-brand" />
          <span className="font-display text-xl font-bold text-cream tracking-tight">
            GROUP<span className="text-brand">GRUB</span> Pro
          </span>
        </div>

        <div className="text-center mb-7">
          <div className="font-display text-5xl font-bold text-cream mb-1">
            10<span className="text-2xl text-muted">€</span>
          </div>
          <div className="text-[0.78rem] text-muted font-mono uppercase tracking-[0.12em]">
            Pagamento único · Acesso vitalício
          </div>
        </div>

        {/* Plans side by side */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="border border-line rounded-2xl p-4">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted mb-3">Free</div>
            {FEATURES_FREE.map((f) => (
              <div key={f} className="flex items-start gap-2 mb-2">
                <Check size={12} className="mt-0.5 flex-shrink-0 text-success" />
                <span className="text-[0.72rem] text-muted leading-snug">{f}</span>
              </div>
            ))}
          </div>
          <div className="border rounded-2xl p-4" style={{ borderColor: 'rgba(255,90,38,0.4)', background: 'rgba(255,90,38,0.04)' }}>
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] mb-3 text-brand">Pro</div>
            {FEATURES_PRO.map((f) => (
              <div key={f} className="flex items-start gap-2 mb-2">
                <Sparkles size={12} className="mt-0.5 flex-shrink-0 text-brand" />
                <span className="text-[0.72rem] text-cream leading-snug">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="O teu email (opcional)"
          className="w-full bg-black/50 border border-line rounded-xl px-4 py-3 text-[0.88rem] text-cream outline-none mb-3 focus:border-brand/60 transition-colors"
        />

        {error && (
          <div className="text-[0.75rem] text-brand mb-3 text-center">{error}</div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-[1rem] transition-all flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(255,90,38,0.4)' : 'linear-gradient(135deg, #c8431a, #ff5a26)',
            color: '#fff',
            boxShadow: loading ? 'none' : '0 0 40px rgba(255,90,38,0.5)',
          }}
        >
          {loading ? (
            <span className="animate-pulse">A redirecionar…</span>
          ) : (
            <><Lock size={16} /> Desbloquear Pro · 10€</>
          )}
        </motion.button>

        <div className="text-center text-[0.68rem] text-faint mt-4">
          Pagamento seguro via Stripe · Sem subscrição
        </div>
      </motion.div>
    </motion.div>
  )
}
