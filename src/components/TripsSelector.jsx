import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTrips } from "../hooks/useTrips"

export default function TripsSelector({ currentTripId, onSwitchTrip, onShowPricing, onShowWizard, userPlan }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const { trips, duplicateTrip, loading } = useTrips()

  const currentTrip = trips.find((trip) => trip.id === currentTripId) || {
    title: loading ? t("app.initializing") : "Minha Viagem",
  }

  const handleDuplicate = async (tripId, title) => {
    const newId = await duplicateTrip(tripId, title + " (cópia)")
    onSwitchTrip(newId)
  }

  if (loading) return null

  return (
    <div className="relative inline-block">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-line bg-white/[0.04] text-cream/80 text-sm font-medium hover:border-brand/40 transition-colors"
      >
        <span className="text-sm">{currentTrip.title}</span>
        <ChevronDown size={12} className="transition-transform duration-200" style={{ transform: isOpen ? "rotate(-180deg)" : "none" }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 w-60 z-[100] surface p-3 max-h-[70vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setIsOpen(false)
                onShowWizard()
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand/40 bg-brand/5 text-brand font-semibold text-sm hover:bg-brand/10 transition-colors mb-2 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> {t("trips.new")}
            </button>

            {trips.length > 0 && (
              <>
                <div className="h-px bg-line my-2" />
                {trips.map((trip) => (
                  <div key={trip.id} className="mb-1">
                    <button
                      onClick={() => {
                        onSwitchTrip(trip.id)
                        window.location.href = window.location.pathname + "?trip=" + trip.id
                        setIsOpen(false)
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl border text-left text-sm transition-colors ${
                        trip.id === currentTripId
                          ? "border-brand/55 bg-brand/[0.09] text-brand"
                          : "border-line bg-white/[0.02] text-cream/80 hover:border-brand/30"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="truncate">{trip.title}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[0.65rem] text-faint">
                            {new Date(trip.created_at).toLocaleDateString("pt-PT")}
                          </span>
                          {userPlan !== "free" && (
                            <Copy
                              size={11}
                              className="text-faint hover:text-brand cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicate(trip.id, trip.title)
                              }}
                            />
                          )}
                        </div>
                      </span>
                    </button>
                  </div>
                ))}
              </>
            )}

            {userPlan === "free" && trips.length >= 1 && (
              <div className="p-3 text-center">
                <span className="text-[0.72rem] text-faint block mb-2">{t("common.freeLimit")}</span>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onShowPricing()
                  }}
                  className="block w-full mt-2 py-2 rounded-xl border border-brand/40 bg-brand/[0.06] text-brand text-[0.75rem] font-semibold"
                >
                  {t("common.unlockPro")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
