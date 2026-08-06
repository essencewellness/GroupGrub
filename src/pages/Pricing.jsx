import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ShieldCheck, Sparkles, X, ArrowRight, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import usePremium from '../hooks/usePremium'

export default function Pricing({ onClose, tripId }) {
  const { t } = useTranslation()
  const { isPremium } = usePremium()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          customerEmail: email || undefined,
          email: email || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Erro ao iniciar checkout')
      }
    } catch (err) {
      console.error(err)
      alert('Não foi possível abrir o checkout. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-[#080a0a] border border-white/10 rounded-2xl p-6 text-cream shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isPremium ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              {t('pricing.proActive')}
            </h2>
            <p className="text-sm text-muted mb-6">
              {t('pricing.proActiveBody')}
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors"
            >
              {t('pricing.continue')}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF5A26]/10 text-[#FF5A26] border border-[#FF5A26]/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                {t('pricing.recommended')}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {t('pricing.header')}
              </h2>
              <p className="text-xs text-muted mt-1">{t('pricing.sub')}</p>
            </div>

            <div className="bg-[#121212] border border-white/10 rounded-xl p-5 mb-6">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-3xl font-extrabold text-white">10€</span>
                  <span className="text-xs text-muted ml-2">{t('pricing.perYear')}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6">
                {t('pricing.benefits', { returnObjects: true }).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-cream/90">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder={t('pricing.emailLabel')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted outline-none focus:border-[#FF5A26] transition-colors"
                />
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#FF5A26] hover:bg-[#FF5A26]/90 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#FF5A26]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{t('pricing.processing')}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t('pricing.ctaPro')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={onClose}
                className="text-xs text-muted hover:text-cream transition-colors"
              >
                {t('pricing.ctaFree')}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
