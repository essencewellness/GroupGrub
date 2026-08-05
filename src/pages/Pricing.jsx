import { useState } from "react"
import { motion } from "framer-motion"
import { Check, CreditCard, X } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import { usePremium, upgradeToPremium } from "../hooks/usePremium"

/**
 * NOTA: este ficheiro estava inteiramente escrito em classes Tailwind, mas o
 * projeto NÃO tem Tailwind instalado — a página renderizava completamente sem
 * estilos. Reescrito em inline styles com o design system cibernético.
 */

const BENEFITS = [
  "Viagens ilimitadas (não só 1)",
  "Exportar lista de compras para PDF",
  "Templates pré-definidos (Praia, Montanha, Camping)",
  "Atribuir items a pessoas específicas",
  "Backup automático na cloud (Supabase)",
  "Partilhar com pessoas ilimitadas",
]

const PRICING_PLANS = [
  {
    id: "free",
    name: "BASE",
    price: "0€",
    features: ["1 viagem", "5 pessoas", "Lista básica"],
    cta: "CONTINUAR GRÁTIS",
    popular: false,
  },
  {
    id: "pro",
    name: "PRO",
    price: "10€",
    subtitle: "licença vitalícia",
    features: BENEFITS,
    cta: "DESBLOQUEAR PRO",
    popular: true,
  },
]

const CUT = 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)'
const CUT_SM = 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)'

export default function Pricing({ onClose }) {
  const { user } = useAuth()
  const { isPremium } = usePremium()
  const [email, setEmail] = useState(user?.email || "")
  const [showAuth, setShowAuth] = useState(false)
  const [processing, setProcessing] = useState(false)

  /* ══ Já é Pro ══ */
  if (isPremium) {
    return (
      <div style={overlay}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="cyber-bracket"
          style={{
            position: 'relative', background: 'linear-gradient(165deg, rgba(10,22,38,0.97), rgba(4,10,20,0.99))',
            border: '1px solid rgba(124,255,79,0.4)', clipPath: CUT,
            padding: 34, maxWidth: 420, width: '100%', textAlign: 'center',
            boxShadow: '0 0 50px rgba(124,255,79,0.18)',
          }}>
          <div style={{ fontSize: '3rem', marginBottom: 14, filter: 'drop-shadow(0 0 20px rgba(124,255,79,0.6))' }}>⚡</div>
          <h2 className="cyber-title" style={{ fontSize: '1.05rem', color: 'var(--lime)', marginBottom: 12, textShadow: '0 0 14px var(--lime-glow)' }}>
            ACESSO PRO ATIVO
          </h2>
          <p className="mono" style={{ fontSize: '0.78rem', color: 'var(--creme-dim)', marginBottom: 24, lineHeight: 1.6 }}>
            Todos os módulos premium desbloqueados.
          </p>
          <button onClick={onClose} className="mono" style={{ ...btnPrimary, borderColor: 'rgba(124,255,79,0.55)', background: 'rgba(124,255,79,0.12)', color: 'var(--lime)', boxShadow: '0 0 20px rgba(124,255,79,0.2)' }}>
            CONTINUAR
          </button>
        </motion.div>
      </div>
    )
  }

  /* ══ Paywall ══ */
  return (
    <div style={{ ...overlay, alignItems: 'flex-start', overflowY: 'auto', padding: '0' }}>
      <div style={{ minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '72px 20px 40px', position: 'relative' }}>

        {/* Fechar */}
        <button onClick={onClose} aria-label="Fechar" style={{
          position: 'fixed', top: 'calc(env(safe-area-inset-top,0px) + 18px)', right: 18, zIndex: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,43,214,0.08)', border: '1px solid rgba(255,43,214,0.35)',
          color: 'var(--magenta)', cursor: 'pointer', clipPath: CUT_SM,
        }}>
          <X size={17} />
        </button>

        <div style={{ maxWidth: 860, width: '100%' }}>
          {/* Cabeçalho */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div className="flicker" style={{ fontSize: '2.6rem', marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.6))' }}>🛰️</div>
            <h1 className="cyber-title glitch" data-text="FÉRIAS CELORICO PRO"
              style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.6rem)', color: 'var(--creme)', marginBottom: 10, textShadow: '0 0 16px rgba(0,240,255,0.45)' }}>
              FÉRIAS <span style={{ color: 'var(--cyan)' }}>CELORICO</span> PRO
            </h1>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--creme-dim)', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
              Uma só app. Telemóvel, tablet e computador.
            </p>
          </div>

          {/* Planos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 26 }}>
            {PRICING_PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plan.popular ? 0.1 : 0 }}
                className={plan.popular ? "cyber-bracket" : undefined}
                style={{
                  position: 'relative',
                  background: plan.popular
                    ? 'linear-gradient(165deg, rgba(0,240,255,0.06), rgba(4,10,20,0.95))'
                    : 'rgba(8,17,29,0.7)',
                  border: `1px solid ${plan.popular ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.14)'}`,
                  clipPath: CUT,
                  padding: 26,
                  boxShadow: plan.popular ? '0 0 40px rgba(0,240,255,0.16)' : 'none',
                }}
              >
                {plan.popular && (
                  <div className="mono" style={{
                    position: 'absolute', top: 0, right: 0, background: 'var(--cyan)', color: '#02060c',
                    fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', padding: '4px 12px',
                  }}>
                    RECOMENDADO
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 22 }}>
                  <h3 className="cyber-title" style={{ fontSize: '0.9rem', color: plan.popular ? 'var(--cyan)' : 'var(--creme-mid)', letterSpacing: '0.14em' }}>
                    {plan.name}
                  </h3>
                  <div style={{ marginTop: 12 }}>
                    <span className="cyber-title" style={{ fontSize: '2.4rem', color: plan.popular ? 'var(--cyan)' : 'var(--creme)', textShadow: plan.popular ? '0 0 20px rgba(0,240,255,0.5)' : 'none' }}>
                      {plan.price}
                    </span>
                    {plan.subtitle && (
                      <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--creme-dim)', marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        {plan.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <ul style={{ listStyle: 'none', display: 'grid', gap: 9, marginBottom: 24 }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <Check size={14} style={{ color: plan.popular ? 'var(--lime)' : 'var(--creme-dim)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--creme-mid)', lineHeight: 1.45 }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === "pro" ? (
                  <button
                    onClick={async () => {
                      setProcessing(true)
                      if (!user) {
                        setShowAuth(true)
                        setProcessing(false)
                        return
                      }
                      upgradeToPremium()
                      setProcessing(false)
                      window.location.reload()
                    }}
                    disabled={processing}
                    className="mono"
                    style={{ ...btnPrimary, opacity: processing ? 0.6 : 1, cursor: processing ? 'wait' : 'pointer' }}
                  >
                    {processing ? "A PROCESSAR…" : (<><CreditCard size={15} /> {plan.cta}</>)}
                  </button>
                ) : (
                  <button onClick={onClose} className="mono" style={btnGhost}>
                    {plan.cta}
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Ativação por email */}
          {showAuth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              style={{ overflow: 'hidden', background: 'rgba(8,17,29,0.75)', border: '1px solid rgba(0,240,255,0.2)', clipPath: CUT, padding: 24, marginBottom: 24 }}
            >
              <div className="label-hud" style={{ marginBottom: 12 }}>EMAIL PARA ATIVAR PRO</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="mono"
                  style={{
                    width: '100%', background: 'rgba(1,3,7,0.7)', border: '1px solid rgba(0,240,255,0.22)',
                    clipPath: CUT_SM, padding: '12px 14px', color: 'var(--creme)', fontSize: '0.85rem', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { upgradeToPremium(); window.location.reload() }}
                    disabled={!email}
                    className="mono"
                    style={{ ...btnPrimary, flex: 1, opacity: email ? 1 : 0.45, cursor: email ? 'pointer' : 'not-allowed' }}
                  >
                    ATIVAR PRO
                  </button>
                  <button onClick={() => setShowAuth(false)} className="mono" style={{ ...btnGhost, width: 'auto', padding: '12px 18px' }}>
                    CANCELAR
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mono" style={{ textAlign: 'center', fontSize: '0.63rem', color: 'rgba(223,246,255,0.28)', lineHeight: 1.8, letterSpacing: '0.06em' }}>
            <p>PWA INSTALÁVEL · WEB · WRAPPER APP STORE</p>
            <p style={{ marginTop: 6 }}>SUPABASE · VERCEL · STRIPE</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── estilos partilhados ── */
const overlay = {
  position: 'fixed', inset: 0, zIndex: 500,
  background: 'rgba(1,3,7,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
}

const btnPrimary = {
  width: '100%', padding: '13px', border: '1px solid rgba(0,240,255,0.6)',
  clipPath: CUT_SM, background: 'rgba(0,240,255,0.13)', color: 'var(--cyan)',
  fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 0 22px rgba(0,240,255,0.2)', transition: 'all 0.2s',
}

const btnGhost = {
  width: '100%', padding: '13px', border: '1px solid rgba(0,240,255,0.16)',
  clipPath: CUT_SM, background: 'rgba(255,255,255,0.02)', color: 'var(--creme-dim)',
  fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.12em', cursor: 'pointer',
  transition: 'all 0.2s',
}
