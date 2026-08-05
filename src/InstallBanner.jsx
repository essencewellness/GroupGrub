import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share, Plus } from 'lucide-react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  // Lê no initializer — evita setState síncrono no effect
  const [isIos] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent))
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const dismissed = sessionStorage.getItem('install-dismissed')
    if (standalone || dismissed) return

    // BUGFIX: timers e listener nunca eram limpos — setState após unmount + leak
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
          style={{
            position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            left: 16, right: 16, zIndex: 300,
            background: 'linear-gradient(135deg, rgba(30,24,16,0.97), rgba(22,18,12,0.97))',
            backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,240,255,0.4)',
            borderRadius: 22, padding: '18px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <button onClick={dismiss} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,240,255,0.14)', border: 'none', color: 'var(--creme-dim)', cursor: 'pointer', clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.55))' }}>🛰️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--creme)', marginBottom: 4 }}>Adicionar ao ecrã</div>
              {isIos ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--creme-mid)', lineHeight: 1.5 }}>
                  Toca em <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong style={{ color: 'var(--cyan)' }}>Partilhar</strong> e depois <strong style={{ color: 'var(--cyan)' }}>"Adicionar ao ecrã de Início"</strong>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--creme-mid)', lineHeight: 1.5 }}>
                  Instala como app — funciona offline!
                </div>
              )}
            </div>
            {!isIos && (
              <motion.button whileTap={{ scale: 0.94 }} onClick={install}
                style={{ padding: '9px 16px', clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)', border: '1px solid rgba(0,240,255,0.6)', background: 'rgba(0,240,255,0.14)', color: 'var(--cyan)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(0,240,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Instalar
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
