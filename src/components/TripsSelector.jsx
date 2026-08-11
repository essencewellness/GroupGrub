import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Trash2, Sparkles } from 'lucide-react'

export default function TripsSelector({
  currentTripId,
  trips = [],
  tripsLoading,
  onSwitchTrip,
  onDeleteTrip,
  onShowWizard,
  onShowPricing,
  isPremium,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const currentTrip = trips.find((t) => t.id === currentTripId) || {
    title: tripsLoading ? '…' : 'Minha Viagem',
  }

  const canCreateMore = isPremium || trips.length === 0

  const handleNewTrip = () => {
    setIsOpen(false)
    if (!canCreateMore) { onShowPricing?.(); return }
    onShowWizard()
  }

  const handleSwitch = (id) => {
    if (id === currentTripId) { setIsOpen(false); return }
    onSwitchTrip?.(id)
    setIsOpen(false)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirmDelete === id) {
      await onDeleteTrip?.(id)
      setConfirmDelete(null)
      if (id === currentTripId) {
        const next = trips.find((t) => t.id !== id)
        if (next) onSwitchTrip?.(next.id)
      }
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 2500)
    }
  }

  if (tripsLoading) return null

  return (
    <div className="relative inline-block">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-line bg-white/[0.04] text-cream/80 text-sm font-medium hover:border-brand/40 transition-colors"
      >
        <span className="max-w-[160px] truncate">{currentTrip.title}</span>
        <ChevronDown
          size={12}
          className="flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(-180deg)' : 'none' }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* backdrop */}
            <div className="fixed inset-0 z-[99]" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              role="listbox"
              className="absolute top-full left-0 mt-2 w-64 z-[100] rounded-2xl border border-white/10 bg-[#0a0c0c] p-2.5 max-h-[70vh] overflow-y-auto"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            >
              {/* Lista de trips */}
              {trips.length > 0 && (
                <div className="mb-2">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 mb-1 cursor-pointer transition-colors ${
                        trip.id === currentTripId
                          ? 'border border-brand/40 bg-brand/[0.08]'
                          : 'border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]'
                      }`}
                      onClick={() => handleSwitch(trip.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[0.85rem] font-semibold truncate"
                          className={trip.id === currentTripId ? 'text-brand' : 'text-cream/85'}
                        >
                          {trip.title}
                        </div>
                        {trip.created_at && (
                          <div className="text-[0.62rem] text-faint font-mono mt-0.5">
                            {new Date(trip.created_at).toLocaleDateString('pt-PT')}
                          </div>
                        )}
                      </div>

                      {onDeleteTrip && trips.length > 1 && (
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          style={{
                            background: confirmDelete === trip.id ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.05)',
                            color: confirmDelete === trip.id ? '#ff3b30' : 'rgba(255,255,255,0.35)',
                            border: confirmDelete === trip.id ? '1px solid rgba(255,59,48,0.4)' : '1px solid transparent',
                          }}
                          title={confirmDelete === trip.id ? 'Clica de novo para confirmar' : 'Eliminar viagem'}
                        >
                          <Trash2 size={12} />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="h-px bg-white/[0.06] mb-2" />

              {/* Nova viagem */}
              {canCreateMore ? (
                <button
                  onClick={handleNewTrip}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand/35 bg-brand/[0.04] text-brand font-semibold text-[0.82rem] hover:bg-brand/[0.09] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Nova viagem
                </button>
              ) : (
                <div className="px-2 pb-1">
                  <div className="text-[0.7rem] text-faint text-center mb-2">
                    Plano Free: 1 viagem activa
                  </div>
                  <button
                    onClick={() => { setIsOpen(false); onShowPricing?.() }}
                    className="w-full py-2.5 px-3 rounded-xl font-bold text-[0.82rem] flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(200,67,26,0.25), rgba(255,90,38,0.18))',
                      border: '1px solid rgba(255,90,38,0.45)',
                      color: '#ff5a26',
                      boxShadow: '0 0 20px rgba(255,90,38,0.2)',
                    }}
                  >
                    <Sparkles size={13} /> Unlock Pro · 10€
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
