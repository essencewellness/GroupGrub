import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(1,3,7,0.82)', backdropFilter: 'blur(10px)', zIndex: 400 }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 401,
              background: 'linear-gradient(165deg, rgba(10,22,38,0.97), rgba(4,10,20,0.99))',
              borderTop: '1px solid rgba(0,240,255,0.45)',
              clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%, 0 20px)',
              padding: '0 0 calc(env(safe-area-inset-bottom,0px) + 24px)',
              boxShadow: '0 -8px 60px rgba(0,0,0,0.85), 0 -1px 24px rgba(0,240,255,0.22)',
              maxHeight: '92dvh',
              overflowY: 'auto',
            }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 0' }}>
              <div style={{ width: 44, height: 3, background: 'var(--cyan)', opacity: 0.55, boxShadow: '0 0 10px var(--cyan)' }} />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px 20px' }}>
              <span className="cyber-title" style={{ fontSize: '0.92rem', color: 'var(--creme)', textShadow: '0 0 10px rgba(0,240,255,0.4)' }}>{title}</span>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
                style={{ background: 'rgba(255,43,214,0.08)', border: '1px solid rgba(255,43,214,0.35)', color: 'var(--magenta)', cursor: 'pointer', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </motion.button>
            </div>
            <div style={{ padding: '0 24px' }}>{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
