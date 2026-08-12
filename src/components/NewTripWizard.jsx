import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const today = new Date().toISOString().slice(0, 10)

export default function NewTripWizard({ open, onClose, onCreate }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const validTitle = title.trim().length > 0
  const dateValid = startDate && endDate && new Date(endDate) >= new Date(startDate)

  const reset = () => {
    setStep(1)
    setTitle('')
    setStartDate('')
    setEndDate('')
    setSubmitting(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const handleCreate = async () => {
    if (!validTitle || !dateValid) return
    setSubmitting(true)
    await onCreate({ title: title.trim(), startDate, endDate })
    setSubmitting(false)
    reset()
  }

  const dialogRef = useRef(null)
  const prevFocusRef = useRef(null)
  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement
      dialogRef.current?.focus()
    } else {
      prevFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wizard-dialog-title"
          tabIndex={-1}
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full max-w-[440px] bg-[#080A0A] border border-white/10 rounded-[28px] p-7 relative outline-none"
          style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgb(var(--brand-rgb) / 0.06)' }}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: step === s ? 28 : 14,
                  background: step >= s ? '#FF5A26' : 'rgba(255,255,255,0.12)',
                  boxShadow: step >= s ? '0 0 10px rgba(255,90,38,0.5)' : 'none',
                }}
              />
            ))}
            <span className="ml-2 font-mono text-[0.62rem] tracking-[0.12em] text-muted uppercase">
              {t('wizard.step')} {step} {t('wizard.of')} 2
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <div className="text-center mb-7">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FF5A26]/10 border border-[#FF5A26]/25 flex items-center justify-center text-2xl" style={{ filter: 'drop-shadow(0 0 12px rgba(255,90,38,0.5))' }}>
                    🛰️
                  </div>
                  <h2 id="wizard-dialog-title" className="font-display text-lg font-bold text-white tracking-tight">{t('wizard.step1Title')}</h2>
                  <p className="text-[0.78rem] text-muted mt-1.5">{t('wizard.step1Sub')}</p>
                </div>

                <label htmlFor="wizard-trip-title" className="sr-only">{t('wizard.step1Title')}</label>
                <input
                  id="wizard-trip-title"
                  aria-required="true"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validTitle && setStep(2)}
                  placeholder={t('wizard.step1Placeholder')}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-cream text-[0.95rem] outline-none transition-all focus:border-brand focus:shadow-glow"
                />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => validTitle && setStep(2)}
                  disabled={!validTitle}
                  className="w-full mt-5 py-3.5 rounded-xl font-mono text-sm font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: validTitle ? '#FF5A26' : 'rgba(255,255,255,0.06)',
                    color: validTitle ? '#000' : 'rgba(245,245,244,0.4)',
                    boxShadow: validTitle ? '0 8px 24px rgba(255,90,38,0.3)' : 'none',
                    cursor: validTitle ? 'pointer' : 'not-allowed',
                  }}
                >
                  {t('wizard.next')} <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <div className="text-center mb-7">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#FF5A26]/10 border border-[#FF5A26]/25 flex items-center justify-center text-2xl">
                    📅
                  </div>
                  <h2 id="wizard-dialog-title" className="font-display text-lg font-bold text-white tracking-tight">{t('wizard.step2Title')}</h2>
                  <p className="text-[0.78rem] text-muted mt-1.5">{t('wizard.step2Sub')}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="wizard-start-date" className="block font-mono text-[0.62rem] tracking-[0.12em] text-muted uppercase mb-1.5">{t('wizard.startDate')}</label>
                    <input
                      id="wizard-start-date"
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-cream text-[0.9rem] outline-none transition-all focus:border-brand [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label htmlFor="wizard-end-date" className="block font-mono text-[0.62rem] tracking-[0.12em] text-muted uppercase mb-1.5">{t('wizard.endDate')}</label>
                    <input
                      id="wizard-end-date"
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-cream text-[0.9rem] outline-none transition-all focus:border-brand [color-scheme:dark]"
                    />
                  </div>
                  {startDate && endDate && !dateValid && (
                    <div role="alert" className="text-[0.72rem] text-[#FF5A26] font-mono">A data de fim tem de ser igual ou depois do início.</div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep(1)}
                    className="py-3.5 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-cream font-mono text-sm font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={15} /> {t('wizard.back')}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={!dateValid || submitting}
                    className="flex-1 py-3.5 rounded-xl font-mono text-sm font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: dateValid && !submitting ? '#FF5A26' : 'rgba(255,255,255,0.06)',
                      color: dateValid && !submitting ? '#000' : 'rgba(245,245,244,0.4)',
                      boxShadow: dateValid && !submitting ? '0 8px 24px rgba(255,90,38,0.3)' : 'none',
                      cursor: dateValid && !submitting ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {submitting ? (
                      <><span className="inline-block w-3.5 h-3.5 border-2 border-black/25 border-t-black rounded-full align-middle mr-1.5" style={{ animation: 'spin .7s linear infinite' }} /> {t('wizard.generating')}</>
                    ) : (
                      <><Sparkles size={15} /> {t('wizard.create')}</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={close}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-muted hover:text-cream transition-colors"
            aria-label={t('common.close')}
          >
            <X size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
