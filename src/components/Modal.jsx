import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null)
  const titleId  = useRef(`modal-title-${Math.random().toString(36).slice(2)}`)
  const previousFocus = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement

    // Move focus into modal on open
    const firstFocusable = panelRef.current?.querySelector(FOCUSABLE)
    firstFocusable?.focus()

    const trapFocus = (e) => {
      if (!panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus() }
        }
      }
      if (e.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', trapFocus)
    return () => {
      document.removeEventListener('keydown', trapFocus)
      previousFocus.current?.focus()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[400]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId.current}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[401] bg-panel border-t border-line rounded-t-[28px] max-h-[92dvh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 60px rgba(0,0,0,0.85), 0 -1px 24px rgb(var(--brand-rgb) / 0.12)', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 24px)' }}
          >
            <div className="flex justify-center pt-3.5" aria-hidden="true">
              <div className="w-11 h-1 bg-brand/55 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span id={titleId.current} className="font-display text-sm font-bold text-cream">{title}</span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                aria-label="Fechar"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] border border-line text-muted hover:text-brand transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </motion.button>
            </div>
            <div className="px-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
