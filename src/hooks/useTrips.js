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
        // Supabase configurado — leitura pública (políticas públicas, sem auth)
        const { data, error: fetchError } = await supabase
          .from("trips")
          .select("*")
          .order("updated_at", { ascending: false })

        if (fetchError) throw fetchError
        const remote = data || []

        // A trip ativa pode ter sido criada localmente e ainda não existir no
        // Supabase (sem sessão / RLS). Sem isto o seletor fica preso em "Carregando…".
        const activeId = localStorage.getItem(LS_TRIP_ID)
        if (activeId && !remote.some((t) => t.id === activeId)) {
          let localMeta = null
          try {
            const cached = JSON.parse(localStorage.getItem(LS_TRIPS) || "[]")
            localMeta = cached.find((t) => t.id === activeId) || null
          } catch { localStorage.removeItem(LS_TRIPS) }
          remote.unshift(localMeta || { id: activeId, title: "Minha Viagem", is_local: true })
        }
        setTrips(remote)
      }
    } catch (err) {
      // Supabase inacessível (offline / sem rede) é um cenário normal — a app
      // funciona com localStorage. Não poluir a consola com error().
      console.warn("Trips: Supabase indisponível, a usar cache local.", err?.message || err)
      setError(err.message)
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

      if (hasSupabase && supabase) {
        const channel = supabase
          .channel("trips-changes")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "trips" },
            (payload) => {
              if (payload.eventType === "INSERT") {
                setTrips((prev) => [payload.new, ...prev])
              } else if (payload.eventType === "UPDATE") {
                setTrips((prev) =>
                  prev.map((t) => (t.id === payload.new.id ? payload.new : t))
                )
              } else if (payload.eventType === "DELETE") {
                setTrips((prev) => prev.filter((t) => t.id !== payload.old.id))
              }
            }
          )
          .subscribe()
        channelCleanup = () => { try { supabase.removeChannel(channel) } catch { /* já removido */ } }
      }
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
          const { data } = await supabase.auth.getUser()
          if (data?.user) {
            const row = { ...newTrip, owner_id: data.user.id }
            const { error: insertError } = await supabase.from("trips").insert(row)
            if (insertError) console.error("Failed to create trip:", insertError)
          }
        } catch {
          // User not authed — continue with localStorage only
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
          const { data } = await supabase.auth.getUser()
          if (data?.user) {
            const row = { ...newTrip, owner_id: data.user.id }
            await supabase.from("trips").insert(row)
          }
        } catch {
          // Silently fail
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
