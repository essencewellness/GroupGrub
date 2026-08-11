import { useState, useEffect, useCallback } from "react"
import { supabase, hasSupabase } from "../lib/supabase"
import { v4 as uuid } from "uuid"
import { claimOwner } from "./useRole"
import { getOrCreateInviteKey } from "../lib/inviteKey"

/**
 * Multi-trips hook.
 * All features visible (no paywall) — works with Supabase when configured,
 * falls back to localStorage otherwise.
 */

const LS_TRIPS = "ferias_trips"
const LS_TRIP_ID = "ferias_trip_id"

/**
 * Expand a YYYY-MM-DD range into an array of Date objects (inclusive).
 * Used by the New Trip Wizard to generate Almoço/Jantar slots per day.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 * @returns {Date[]}
 */
export function dateRange(startDate, endDate) {
  if (!startDate || !endDate) return []
  const start = new Date(startDate + "T00:00:00")
  const end = new Date(endDate + "T00:00:00")
  const days = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

export function useTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load trips for the user
  const loadTrips = useCallback(async () => {
    setLoading(true)
    try {
      if (!hasSupabase || !supabase) {
        // No Supabase — localStorage fallback (immediate)
        const singleTrip = localStorage.getItem(LS_TRIP_ID)
        if (singleTrip) {
          setTrips([{ id: singleTrip, title: "Minha Viagem", is_local: true }])
        } else {
          setTrips([])
        }
      } else {
        // C-5 fix: apenas buscar trips que este dispositivo criou ou conhece.
        // Sem RLS/auth real, uma query sem filtro expunha trips de todos os utilizadores.
        const activeId = localStorage.getItem(LS_TRIP_ID)
        let knownIds = []
        try {
          knownIds = JSON.parse(localStorage.getItem(LS_TRIPS) || "[]").map((t) => t.id)
        } catch { localStorage.removeItem(LS_TRIPS) }
        if (activeId && !knownIds.includes(activeId)) knownIds.push(activeId)

        if (knownIds.length === 0) {
          setTrips([])
          return
        }

        const { data, error: fetchError } = await Promise.race([
          supabase.from("trips").select("*").in("id", knownIds).order("created_at", { ascending: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("loadTrips timeout")), 5000)),
        ])

        if (fetchError) throw fetchError
        const remote = data || []

        // A trip ativa pode ter sido criada localmente e ainda não existir no Supabase.
        if (activeId && !remote.some((t) => t.id === activeId)) {
          let localMeta = null
          try {
            const cached = JSON.parse(localStorage.getItem(LS_TRIPS) || "[]")
            localMeta = cached.find((t) => t.id === activeId) || null
          } catch { /* já limpo acima */ }
          remote.unshift(localMeta || { id: activeId, title: "Minha Viagem", is_local: true })
        }
        setTrips(remote)
      }
    } catch (err) {
      // Supabase inacessível (offline / sem rede) é um cenário normal — a app
      // funciona com localStorage. Não poluir a consola com error().
      console.warn("Trips: Supabase indisponível, a usar cache local.", err?.message || err)
      setError(err?.message ?? String(err))
      // Fallback to localStorage (com guarda contra JSON corrompido)
      try {
        const local = localStorage.getItem(LS_TRIPS)
        if (local) setTrips(JSON.parse(local))
      } catch { localStorage.removeItem(LS_TRIPS) }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let channelCleanup = () => {}

    ;(async () => {
      await loadTrips()
      if (cancelled) return

      // C-6 fix: sem subscription global a trips — escutava eventos de TODOS os utilizadores.
      // Trips mudam raramente; o loadTrips no visibilitychange cobre actualizações necessárias.
    })()

    return () => {
      cancelled = true
      channelCleanup()
    }
  }, [loadTrips])

  // Create a new trip (optionally with a date range for slot generation)
  const createTrip = useCallback(
    async (title, template = null, startDate = null, endDate = null) => {
      const tripId = uuid().slice(0, 8)
      const now = new Date().toISOString()

      const newTrip = {
        id: tripId,
        title: title || "Nova Viagem",
        template_type: template || null,
        start_date: startDate || null,
        end_date: endDate || null,
        created_at: now,
        updated_at: now,
      }

      if (hasSupabase && supabase) {
        try {
          // Anonymous app — upsert without owner_id so the trip row exists in Supabase
          // even without Supabase Auth. Items/meals/expenses reference this row via FK.
          const { error: insertError } = await supabase
            .from("trips")
            .upsert(newTrip, { onConflict: "id" })
          if (insertError) console.warn("Failed to create trip in Supabase:", insertError)
        } catch (e) {
          console.warn("Supabase unavailable, trip saved to localStorage only:", e?.message)
        }
      }

      // Always update localStorage as fallback
      const all = JSON.parse(localStorage.getItem(LS_TRIPS) || "[]")
      localStorage.setItem(LS_TRIPS, JSON.stringify([newTrip, ...all]))

      // Set as active, claim ownership, and generate invite key
      localStorage.setItem(LS_TRIP_ID, tripId)
      sessionStorage.setItem(LS_TRIP_ID, tripId)
      claimOwner(tripId)
      getOrCreateInviteKey(tripId)

      setTrips((prev) => [newTrip, ...prev])
      return tripId
    },
    []
  )

  // Switch active trip — navega para o URL com o novo trip ID e recarrega
  const switchTrip = useCallback((tripId) => {
    if (!tripId || tripId.length < 6) return
    localStorage.setItem(LS_TRIP_ID, tripId)
    sessionStorage.setItem(LS_TRIP_ID, tripId)
    const url = new URL(window.location)
    url.searchParams.set('trip', tripId)
    url.hash = ''
    window.location.href = url.toString()
  }, [])

  // Duplicate an existing trip
  const duplicateTrip = useCallback(
    async (sourceTripId, newTitle) => {
      const tripId = uuid().slice(0, 8)
      const now = new Date().toISOString()

      const newTrip = {
        id: tripId,
        title: newTitle,
        template_type: null,
        created_at: now,
        updated_at: now,
        source_trip_id: sourceTripId,
      }

      if (hasSupabase && supabase) {
        try {
          await supabase.from("trips").upsert(newTrip, { onConflict: "id" })
        } catch (e) {
          console.warn("Supabase unavailable, duplicated trip saved locally only:", e?.message)
        }
      }

      const all = JSON.parse(localStorage.getItem(LS_TRIPS) || "[]")
      localStorage.setItem(LS_TRIPS, JSON.stringify([newTrip, ...all]))

      // Copy items from source trip
      // This would be handled by the db layer — for now just set the ID
      localStorage.setItem(LS_TRIP_ID, tripId)

      setTrips((prev) => [newTrip, ...prev])
      return tripId
    },
    []
  )

  const deleteTrip = useCallback(async (tripId) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId))
    if (hasSupabase && supabase) {
      try { await supabase.from('trips').delete().eq('id', tripId) } catch { /* fallback */ }
    }
    try {
      const all = JSON.parse(localStorage.getItem(LS_TRIPS) || '[]').filter((t) => t.id !== tripId)
      localStorage.setItem(LS_TRIPS, JSON.stringify(all))
    } catch { /* quota */ }
  }, [])

  return {
    trips,
    loading,
    error,
    createTrip,
    switchTrip,
    duplicateTrip,
    deleteTrip,
    refresh: loadTrips,
  }
}
