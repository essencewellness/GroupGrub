import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Plus, Copy } from "lucide-react"
import { useTrips } from "../hooks/useTrips"
import { TEMPLATES, TEMPLATE_KEYS } from "../lib/templates"

export default function TripsSelector({ currentTripId, onSwitchTrip, onShowPricing, userPlan }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTripName, setNewTripName] = useState("")
  const { trips, createTrip, duplicateTrip, loading } = useTrips()

  const currentTrip = trips.find((t) => t.id === currentTripId) || { title: loading ? "A CARREGAR…" : "Minha Viagem" }

  const handleCreateTrip = async (useTemplate = null) => {
    const title = newTripName || "Nova Viagem"
    const tripId = await createTrip(title, useTemplate)
    setShowCreate(false)
    setShowTemplates(false)
    setNewTripName("")
    onSwitchTrip(tripId)
    setIsOpen(false)
  }

  const handleDuplicate = async (tripId, title) => {
    const newId = await duplicateTrip(tripId, title + " (cópia)")
    onSwitchTrip(newId)
  }

  if (loading) return null

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
          background: "rgba(0,240,255,0.05)",
          border: "1px solid rgba(0,240,255,0.20)",
          color: "var(--creme-mid)",
                    fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: "0.85rem" }}>{currentTrip.title || "Carregando…"}</span>
        <ChevronDown size={12} style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(-180deg)" : "rotate(0)" }} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "linear-gradient(180deg, rgba(10,22,38,0.97), rgba(4,10,20,0.99))",
              border: "1px solid rgba(0,240,255,0.20)",
              clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)',
              padding: 12,
              boxShadow: "0 20px 50px rgba(0,0,0,0.75), 0 0 26px rgba(0,240,255,0.18)",
              zIndex: 100,
              maxHeight: "70vh",
              overflowY: "auto",
              marginTop: 8,
            }}
          >
            {/* Create new trip button (premium if limited) */}
            <button
              onClick={() => setShowCreate(true)}
              style={{
                width: "100%",
                padding: "10px 12px",
                clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
                border: "1px dashed rgba(0,240,255,0.4)",
                background: "rgba(0,240,255,0.06)",
                color: "var(--cyan)",
                                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Plus size={14} /> Nova viagem
            </button>

            {/* Templates button (premium) */}
            {userPlan !== "free" && (
              <button
                onClick={() => setShowTemplates(true)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
                  border: "1px solid rgba(0,240,255,0.20)",
                  background: "rgba(0,240,255,0.03)",
                  color: "var(--creme-mid)",
                                    fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                📋 Usar template
              </button>
            )}

            {/* Trips list */}
            {trips.length > 0 && (
              <>
                <div style={{ height: 1, background: "rgba(0,240,255,0.05)", margin: "8px 0" }} />
                {trips.map((trip) => (
                  <div key={trip.id} style={{ marginBottom: 4 }}>
                    <button
                      onClick={() => {
                        onSwitchTrip(trip.id)
                        window.location.href = window.location.pathname + "?trip=" + trip.id
                        setIsOpen(false)
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
                        border: trip.id === currentTripId
                          ? "1px solid rgba(0,240,255,0.55)"
                          : "1px solid rgba(0,240,255,0.14)",
                        background: trip.id === currentTripId
                          ? "rgba(0,240,255,0.09)"
                          : "rgba(0,240,255,0.02)",
                        color: trip.id === currentTripId ? "var(--cyan)" : "var(--creme-dim)",
                                                fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{trip.title || "Sem nome"}</span>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: "0.65rem", color: "rgba(223,246,255,0.30)" }}>
                          {new Date(trip.created_at).toLocaleDateString("pt-PT")}
                        </span>
                        {userPlan !== "free" && (
                          <Copy
                            size={11}
                            style={{ color: "rgba(223,246,255,0.30)", cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicate(trip.id, trip.title)
                            }}
                          />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Free limit message */}
            {userPlan === "free" && trips.length >= 1 && (
              <div style={{ padding: "8px 12px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "rgba(223,246,255,0.30)" }}>
                  Limite free: 1 viagem
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onShowPricing()
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 8,
                    padding: "8px",
                    clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
                    border: "1px solid rgba(0,240,255,0.4)",
                    background: "rgba(0,240,255,0.06)",
                    color: "var(--cyan)",
                                        fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Unlock Pro → 10€
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Trip Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(1,3,7,0.85)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(180deg, rgba(10,22,38,0.97), rgba(4,10,20,0.99))",
                border: "1px solid rgba(0,240,255,0.4)",
                clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)',
                padding: 24,
                maxWidth: 400,
                width: "90%",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--creme)", marginBottom: 4 }}>
                Nova viagem
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--creme-dim)", marginBottom: 16 }}>
                Cria uma nova viagem para organizar as compras e refeições.
              </p>
              <input
                type="text"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                placeholder="Nome da viagem (ex: Férias Celorico)..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
                  border: "1px solid rgba(0,240,255,0.20)",
                  background: "rgba(1,3,7,0.65)",
                  color: "var(--creme)",
                                    fontSize: "0.85rem",
                  marginBottom: 16,
                  outline: "none",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTrip()}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowTemplates(true)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
                    border: "1px solid rgba(0,240,255,0.20)",
                    background: "rgba(0,240,255,0.03)",
                    color: "var(--creme-mid)",
                                        fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Usar template
                </button>
                <button
                  onClick={() => handleCreateTrip()}
                  disabled={!newTripName.trim()}
                  style={{
                    flex: 1,
                    padding: "10px",
                    clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
                    border: "none",
                    background: newTripName.trim()
                      ? "rgba(0,240,255,0.16)"
                      : "rgba(0,240,255,0.08)",
                    color: "var(--cyan)",
                                        fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: newTripName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Criar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(1,3,7,0.9)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflowY: "auto",
            }}
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(180deg, rgba(10,22,38,0.97), rgba(4,10,20,0.99))",
                border: "1px solid rgba(0,240,255,0.4)",
                clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)',
                padding: 24,
                maxWidth: 500,
                width: "90%",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--creme)", marginBottom: 16 }}>
                Escolhe um template
              </h3>
              <div style={{ display: "grid", gap: 12 }}>
                {TEMPLATE_KEYS.map((key) => {
                  const tmpl = TEMPLATES[key]
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setShowTemplates(false)
                        setShowCreate(false)
                        handleCreateTrip(key)
                      }}
                      style={{
                        width: "100%",
                        padding: "14px",
                        clipPath: 'polygon(11px 0,100% 0,100% calc(100% - 11px),calc(100% - 11px) 100%,0 100%,0 11px)',
                        border: "1px solid rgba(0,240,255,0.14)",
                        background: "rgba(8,17,29,0.72)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.4rem" }}>{tmpl.name.split(" ")[0]}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--creme)", fontSize: "0.9rem" }}>
                            {tmpl.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--creme-dim)" }}>
                            {tmpl.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
