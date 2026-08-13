import { useState, useEffect, useCallback } from "react"
import { supabase, hasSupabase } from "../lib/supabase"
import { v4 as uuid } from "uuid"
import { claimOwner } from "./useRole"
import { getOrCreateInviteKey } from "../lib/inviteKey"
import { upsertTrip, deleteTrip as dbDeleteTrip } from "../lib/db"

/**
 * Multi-trips hook.
 * All features visible (no paywall) — works with Supabase when configured,
 * falls back to localStorage otherwise.
 */

const LS_TRIPS = "ferias_trips"
const LS_TRIP_ID = "ferias_trip_id"

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

    ;(async () => {
      await loadTrips()
      if (cancelled) return

      // C-6 fix: sem subscription global a trips — escutava eventos de TODOS os utilizadores.
      // Trips mudam raramente; o loadTrips no visibilitychange cobre actualizações necessárias.
    })()

    return () => {
      cancelled = true
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

      // Set as active, claim ownership, and generate the invite token BEFORE
      // writing — the write goes through the server-side proxy (anon has no
      // direct INSERT rights on trips, only service_role does), and the proxy
      // needs a token to bootstrap write-authorization for this brand-new trip.
      localStorage.setItem(LS_TRIP_ID, tripId)
      sessionStorage.setItem(LS_TRIP_ID, tripId)
      claimOwner(tripId)
      getOrCreateInviteKey(tripId)

      // upsertTrip writes through the server-side proxy and also mirrors to
      // localStorage (upsert-by-id), so no separate local write is needed here.
      await upsertTrip(newTrip)

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
      }

      // Same bootstrap-token-first requirement as createTrip — see comment there.
      localStorage.setItem(LS_TRIP_ID, tripId)
      claimOwner(tripId)
      getOrCreateInviteKey(tripId)

      await upsertTrip(newTrip)

      // Copy items from source trip
      // This would be handled by the db layer — for now just set the ID

      setTrips((prev) => [newTrip, ...prev])
      return tripId
    },
    []
  )

  const deleteTrip = useCallback(async (tripId) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId))
    // Must read the invite token before clearing it below.
    if (hasSupabase) {
      try { await dbDeleteTrip(tripId) } catch { /* fallback */ }
    }
    // Clean up all localStorage keys for this trip
    const keysToRemove = [
      `ferias_meta_${tripId}`,
      `ferias_plano_${tripId}`,
      `ferias_pessoas_${tripId}`,
      `ferias_invite_${tripId}`,
      `gg_owner_${tripId}`,
    ]
    keysToRemove.forEach(k => localStorage.removeItem(k))
    try {
      const all = JSON.parse(localStorage.getItem(LS_TRIPS) || '[]').filter((t) => t.id !== tripId)
      localStorage.setItem(LS_TRIPS, JSON.stringify(all))
    } catch { /* quota */ }
    // If deleted the active trip, clear the active pointer
    if (localStorage.getItem(LS_TRIP_ID) === tripId) {
      localStorage.removeItem(LS_TRIP_ID)
      sessionStorage.removeItem(LS_TRIP_ID)
    }
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
