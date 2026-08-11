import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ArrowRight } from 'lucide-react'

const PERKS = [
  { icon: '🛰️', text: 'Cria as tuas próprias viagens em grupo' },
  { icon: '🍽️', text: 'Plano de refeições com lista de ingredientes automática' },
  { icon: '🛒', text: 'Lista de compras inteligente por categoria' },
  { icon: '🧾', text: 'Divide despesas — vê quem deve a quem' },
  { icon: '🔗', text: 'Convida amigos por link — eles entram grátis' },
]

export default function GuestUpsellModal({ tripId, onClose }) {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(() => localStorage.getItem('groupgrub_guest_name') || '')
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Espera 3s para o utilizador ter tempo de explorar a app antes de ver o modal
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const handleCheckout = async () => {
    if (!name.trim()) return
    setLoading(true)
    if (name.trim()) localStorage.setItem('groupgrub_user_name', name.trim())
    if (email.trim()) localStorage.setItem('groupgrub_user_email', email.trim())
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, customerEmail: email.trim() || undefined }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[28px] relative overflow-hidden max-h-[90dvh] overflow-y-auto"
            style={{
              background: 'linear-gradient(160deg, #0d0d0e 0%, #0a0a0b 100%)',
              border: '1px solid rgba(255,90,38,0.18)',
              boxShadow: '0 -8px 60px rgba(255,90,38,0.15), 0 30px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Glow top */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,90,38,0.6), transparent)' }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top, rgba(255,90,38,0.12) 0%, transparent 70%)' }}
            />

            <div className="p-6 pb-8 relative z-10">
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-cream transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X size={15} />
              </button>

              {/* Header */}
              <div className="text-center mb-5">
                <motion.div
                  animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="text-4xl mb-3"
                >
                  🍽️
                </motion.div>
                <div className="font-mono text-[0.6rem] font-bold tracking-[0.18em] uppercase mb-2 text-brand">
                  Estás a gostar?
                </div>
                <h2 className="font-display text-[1.45rem] font-bold text-cream leading-tight tracking-tight">
                  Organiza a <span className="text-brand">tua próxima</span> viagem
                </h2>
                <p className="text-muted text-[0.8rem] mt-2 leading-relaxed">
                  O teu amigo usa o GroupGrub para planear tudo. Por <strong className="text-cream">10€ vitalícios</strong> tens acesso completo para sempre.
                </p>
              </div>

              {/* Perks */}
              <div className="space-y-2 mb-5">
                {PERKS.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.07 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="text-base flex-shrink-0">{p.icon}</span>
                    <span className="text-[0.78rem] text-cream/80">{p.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Form */}
              <div className="space-y-2 mb-4">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-cream text-[0.88rem] outline-none focus:border-brand/50 transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email (para recuperar o acesso)"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-cream text-[0.88rem] outline-none focus:border-brand/50 transition-all"
                />
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                disabled={!name.trim() || loading}
                className="w-full py-4 rounded-2xl font-bold text-[1rem] flex items-center justify-center gap-2 transition-all"
                style={{
                  background: name.trim() && !loading
                    ? 'linear-gradient(135deg, #c8431a 0%, #ff5a26 55%, #ff7a50 100%)'
                    : 'rgba(255,90,38,0.25)',
                  color: name.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: name.trim() && !loading ? '0 0 40px rgba(255,90,38,0.4), 0 8px 30px rgba(0,0,0,0.5)' : 'none',
                  cursor: name.trim() && !loading ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 rounded-full border-white/30 border-t-white" style={{ animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <><Sparkles size={16} /> COMEÇAR — 10€ vitalício <ArrowRight size={15} /></>
                )}
              </motion.button>

              <div className="text-center mt-3 space-y-1">
                <div className="text-[0.65rem] text-faint">Pagamento único · Sem subscrição · Os teus amigos entram grátis</div>
                <button onClick={handleClose} className="text-[0.68rem] text-faint/60 hover:text-muted transition-colors underline underline-offset-2">
                  Continuar como visitante
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
