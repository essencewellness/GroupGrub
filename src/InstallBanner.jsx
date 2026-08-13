import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, Plus } from 'lucide-react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIos] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent))
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const dismissed = sessionStorage.getItem('install-dismissed')
    if (standalone || dismissed) return

    let timer
    if (isIos) {
      timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      timer = setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      clearTimeout(timer)
    }
  }, [isIos])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setShow(false)
    }
  }

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem('install-dismissed', '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] left-4 right-4 z-[300] bg-panel border border-brand/40 rounded-[22px] p-5"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}
        >
          <button
            onClick={dismiss}
            aria-label="Dispensar banner de instalação"
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white/[0.04] text-muted hover:text-brand transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>

          <div className="flex gap-3.5 items-center">
            <div className="text-2xl">🛰️</div>
            <div className="flex-1">
              <div className="font-bold text-[0.95rem] text-cream mb-1">Instalar GroupGrub</div>
              {isIos ? (
                <div className="text-[0.78rem] text-muted leading-snug">
                  Toca em <Share size={12} className="inline align-middle" aria-hidden="true" />{' '}
                  <strong className="text-brand">Partilhar</strong> e depois <strong className="text-brand">"Adicionar ao ecrã de Início"</strong>
                </div>
              ) : (
                <div className="text-[0.78rem] text-muted leading-snug">
                  Instala como app — funciona offline!
                </div>
              )}
            </div>
            {!isIos && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={install}
                className="btn-brand px-4 py-2.5 text-[0.8rem] font-bold whitespace-nowrap flex items-center gap-1.5"
              >
                <Plus size={14} aria-hidden="true" /> Instalar
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
