import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, UtensilsCrossed, ShoppingCart, Receipt, Users, RotateCcw, Check } from 'lucide-react'

const PREMIUM_KEY = 'groupgrub_lifetime_pro'

const FEATURES = [
  { icon: UtensilsCrossed, emoji: '🍽️', title: 'Plano de refeições', desc: 'Organiza todos os jantares e almoços, com lista de ingredientes automática.' },
  { icon: ShoppingCart, emoji: '🛒', title: 'Lista de compras inteligente', desc: 'Auto-categoriza por tipo — Frescos, Talho, Bebidas, Dispensa.' },
  { icon: Receipt, emoji: '🧾', title: 'Divide as despesas', desc: 'Regista quem pagou o quê e vê o resumo de quem deve a quem.' },
  { icon: Users, emoji: '👥', title: 'Convida os amigos', desc: 'Partilha um link por WhatsApp — os convidados vêem e colaboram gratuitamente.' },
]

export default function Onboarding({ tripId }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [focusedField, setFocusedField] = useState(null)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState(null)
  const [recoveryOk, setRecoveryOk] = useState(false)
  // Step 2: code verification
  const [recoveryStep, setRecoveryStep] = useState('email') // 'email' | 'code'
  const [recoveryCode, setRecoveryCode] = useState('')
  const [verifyingCode, setVerifyingCode] = useState(false)

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleRecovery = async () => {
    const trimmed = recoveryEmail.trim()
    if (!trimmed) { setRecoveryError('Indica o teu email.'); return }
    if (!EMAIL_RE.test(trimmed)) { setRecoveryError('Email inválido.'); return }
    setRecovering(true)
    setRecoveryError(null)
    try {
      const res = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      // Always show code step — never reveal if email exists (A-8)
      setRecoveryStep('code')
    } catch {
      setRecoveryError('Sem ligação. Tenta novamente.')
    } finally {
      setRecovering(false)
    }
  }

  const handleVerifyCode = async () => {
    const code = recoveryCode.trim()
    if (!/^\d{6}$/.test(code)) { setRecoveryError('Código de 6 dígitos inválido.'); return }
    setVerifyingCode(true)
    setRecoveryError(null)
    try {
      const res = await fetch('/api/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim(), token: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setRecoveryOk(true)
        localStorage.setItem(PREMIUM_KEY, 'true')
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setRecoveryError(data.error || 'Código inválido ou expirado. Tenta novamente.')
      }
    } catch {
      setRecoveryError('Sem ligação. Tenta novamente.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleCheckout = async () => {
    if (!name.trim()) { setError('Indica o teu nome para continuar.'); return }
    setLoading(true)
    setError(null)
    if (name.trim()) localStorage.setItem('groupgrub_user_name', name.trim())
    if (email.trim()) localStorage.setItem('groupgrub_user_email', email.trim())
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, customerEmail: email.trim() || undefined }),
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

  const inputStyle = (field) => ({
    borderColor: focusedField === field ? 'rgb(var(--brand-rgb) / 0.65)' : 'rgba(255,255,255,0.1)',
    boxShadow: focusedField === field ? '0 0 0 3px rgb(var(--brand-rgb) / 0.12)' : 'none',
  })

  return (
    <div className="min-h-dvh bg-black flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* Background atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 85%, rgba(255,90,38,0.09) 0%, transparent 65%)' }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,90,38,0.25), transparent)' }}
      />

      <div className="w-full max-w-[390px] relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-9"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-5"
          >
            🍽️
          </motion.div>
          <h1 className="font-display text-[2rem] font-bold text-cream tracking-tight leading-none mb-2">
            GROUP<span className="text-brand">GRUB</span>
          </h1>
          <p className="text-muted text-[0.88rem] leading-relaxed">
            O organizador de viagens em grupo<br />que todos vão adorar.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="space-y-2 mb-7"
        >
          {FEATURES.map(({ emoji, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>
              <div>
                <div className="font-semibold text-[0.88rem] text-cream leading-snug">{title}</div>
                <div className="text-[0.75rem] text-muted mt-0.5 leading-relaxed">{desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-7 p-6 rounded-[20px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="font-mono text-[0.65rem] font-bold tracking-[0.16em] text-muted uppercase mb-4 text-center">
              Cria a tua conta de organizador
            </div>

            <label htmlFor="onboarding-name" className="sr-only">O teu nome</label>
            <input
              id="onboarding-name"
              aria-required="true"
              value={name}
              onChange={e => { setName(e.target.value); setError(null) }}
              placeholder="O teu nome"
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-black/70 border rounded-xl px-4 py-3.5 text-cream text-base outline-none transition-all mb-2.5"
              style={inputStyle('name')}
            />
            <label htmlFor="onboarding-email" className="sr-only">Email (para recibos e recuperação)</label>
            <input
              id="onboarding-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null) }}
              placeholder="Email (para recibos e recuperação)"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-black/70 border rounded-xl px-4 py-3.5 text-cream text-base outline-none transition-all mb-4"
              style={inputStyle('email')}
            />

            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[0.75rem] text-brand mb-3 text-center font-mono"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-[1.05rem] flex items-center justify-center gap-2.5 transition-all"
              style={{
                background: loading
                  ? 'rgba(255,90,38,0.4)'
                  : 'linear-gradient(135deg, #c8431a 0%, #ff5a26 55%, #ff7a50 100%)',
                color: loading ? 'rgba(255,255,255,0.6)' : '#fff',
                boxShadow: loading ? 'none' : '0 0 50px rgba(255,90,38,0.4), 0 10px 40px rgba(0,0,0,0.5)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="inline-block w-4 h-4 border-2 rounded-full border-white/30 border-t-white"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                  A redirecionar…
                </>
              ) : (
                <>COMEÇAR <span className="opacity-70 font-normal">—</span> 10€ <ArrowRight size={16} /></>
              )}
            </motion.button>
          </div>

          <div className="text-center space-y-1 mb-6">
            <div className="text-[0.7rem] text-faint">
              Pagamento único · Acesso vitalício · Sem subscrição
            </div>
            <div className="text-[0.68rem] text-faint/60">
              Pagamento seguro via <span className="text-muted">Stripe</span> · Os teus amigos entram grátis
            </div>
          </div>

          {/* Recovery section */}
          <div className="text-center">
            <button
              aria-expanded={showRecovery}
              aria-controls="recovery-panel"
              onClick={() => { setShowRecovery(v => !v); setRecoveryError(null); setRecoveryOk(false) }}
              className="text-[0.78rem] text-muted hover:text-cream transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Já compraste? Recuperar acesso
            </button>
          </div>

          <AnimatePresence>
            {showRecovery && (
              <motion.div
                id="recovery-panel"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="font-mono text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase mb-3 text-center">
                    Recuperar acesso anterior
                  </div>
                  {recoveryOk ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 py-3"
                      style={{ color: '#34d399' }}
                    >
                      <Check size={18} strokeWidth={3} />
                      <span className="font-bold text-base">Acesso recuperado! A recarregar…</span>
                    </motion.div>
                  ) : recoveryStep === 'email' ? (
                    <>
                      <label htmlFor="recovery-email" className="sr-only">Email usado no pagamento</label>
                      <input
                        id="recovery-email"
                        type="email"
                        value={recoveryEmail}
                        onChange={e => { setRecoveryEmail(e.target.value); setRecoveryError(null) }}
                        placeholder="Email usado no pagamento"
                        onKeyDown={e => { if (e.key === 'Enter') handleRecovery() }}
                        className="w-full bg-black/70 border border-white/10 rounded-xl px-4 py-3 text-cream text-base outline-none transition-all mb-2.5"
                        style={{ borderColor: recoveryError ? 'rgba(255,90,38,0.5)' : undefined }}
                      />
                      {recoveryError && (
                        <div role="alert" className="text-[0.73rem] text-brand mb-2.5 font-mono leading-relaxed">{recoveryError}</div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleRecovery}
                        disabled={recovering}
                        className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: recovering ? 'rgba(255,90,38,0.25)' : 'rgba(255,90,38,0.15)',
                          color: recovering ? 'rgba(255,90,38,0.5)' : '#ff5a26',
                          border: '1px solid rgba(255,90,38,0.3)',
                          cursor: recovering ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {recovering ? (
                          <><span className="inline-block w-3.5 h-3.5 border-2 rounded-full border-brand/30 border-t-brand" style={{ animation: 'spin 0.7s linear infinite' }} /> A enviar…</>
                        ) : (
                          <><RotateCcw size={14} /> Enviar código</>
                        )}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="text-[0.73rem] text-muted mb-3 text-center leading-relaxed">
                        Enviámos um código de 6 dígitos para<br />
                        <span className="text-cream font-mono">{recoveryEmail}</span>
                      </div>
                      <label htmlFor="recovery-code" className="sr-only">Código de verificação de 6 dígitos</label>
                      <input
                        id="recovery-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={recoveryCode}
                        onChange={e => { setRecoveryCode(e.target.value.replace(/\D/g, '')); setRecoveryError(null) }}
                        onKeyDown={e => { if (e.key === 'Enter') handleVerifyCode() }}
                        placeholder="000000"
                        autoFocus
                        className="w-full bg-black/70 border border-white/10 rounded-xl px-4 py-3 text-cream text-[1.4rem] font-mono text-center tracking-[0.3em] outline-none transition-all mb-2.5"
                        style={{ borderColor: recoveryError ? 'rgba(255,90,38,0.5)' : undefined }}
                      />
                      {recoveryError && (
                        <div role="alert" className="text-[0.73rem] text-brand mb-2.5 font-mono leading-relaxed">{recoveryError}</div>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleVerifyCode}
                        disabled={verifyingCode}
                        className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mb-2"
                        style={{
                          background: verifyingCode ? 'rgba(255,90,38,0.25)' : 'rgba(255,90,38,0.15)',
                          color: verifyingCode ? 'rgba(255,90,38,0.5)' : '#ff5a26',
                          border: '1px solid rgba(255,90,38,0.3)',
                          cursor: verifyingCode ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {verifyingCode ? (
                          <><span className="inline-block w-3.5 h-3.5 border-2 rounded-full border-brand/30 border-t-brand" style={{ animation: 'spin 0.7s linear infinite' }} /> A verificar…</>
                        ) : (
                          <><Check size={14} /> Confirmar código</>
                        )}
                      </motion.button>
                      <button
                        onClick={() => { setRecoveryStep('email'); setRecoveryCode(''); setRecoveryError(null) }}
                        className="w-full text-center text-[0.72rem] text-faint hover:text-muted transition-colors"
                      >
                        ← Usar outro email
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
