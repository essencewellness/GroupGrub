/**
 * Data layer — Supabase when configured, localStorage otherwise.
 * All functions are async so the caller never needs to change when upgrading.
 * Includes multi-trip support + assignment tracking.
 * Uses promise timeout wrapper for robustness against hanging Supabase requests.
 */
import { supabase, hasSupabase } from './supabase'
import { getEffectiveToken } from './inviteKey'

async function apiWrite(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} ${res.status}`)
}

async function apiPatch(path, body) {
  const res = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} PATCH ${res.status}`)
}

async function apiDelete(path, body) {
  const res = await fetch(path, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} DELETE ${res.status}`)
}

const LS_ITEMS    = 'ferias_items'
const LS_MEALS    = 'ferias_meals'
const LS_TRIPS    = 'ferias_trips'
const LS_EXPENSES = 'ferias_expenses'

/* ── helpers ── */
const lsGet  = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } }
const lsSet  = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota cheia */ } }

/**
 * Funde as linhas remotas de uma trip na cache local, preservando as linhas
 * das OUTRAS trips (a cache é global, uma só chave para todas as viagens).
 */
function mergeById(cache, rows, tripId) {
  const others = cache.filter(r => r.trip_id !== tripId)
  return [...others, ...rows]
}

/**
 * Timeout wrapper — if a Supabase request takes too long, treat as failure.
 * Prevents infinite loading states when DB is unreachable.
 */
function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ])
}

/* ══════════════════════════════
   TRIPS (Multi-trip support)
══════════════════════════════ */
/**
 * NOTE: This app has no Supabase Auth — owner_id is never set on trips rows,
 * so querying by owner_id always returns an empty array. The Supabase branch
 * below is therefore unreachable in practice; trip lists live in localStorage.
 * Do not remove the guard — it documents the intended upgrade path if auth
 * is added later (owner_id would be populated at trip creation time).
 */
export async function fetchTrips(userId) {
  if (hasSupabase && userId) {
    try {
      const { data } = await withTimeout(
        supabase
          .from('trips')
          .select('id,title,owner_id,template_type,start_date,end_date,plano,created_at,updated_at')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
      )
      return data ?? []
    } catch { return lsGet(LS_TRIPS, []) }
  }
  return lsGet(LS_TRIPS, [])
}

export async function upsertTrip(trip) {
  const row = { ...trip }
  if (hasSupabase) {
    const token = getEffectiveToken(trip.id)
    if (token) {
      try { await withTimeout(apiWrite('/api/trip', { tripId: trip.id, token, trip: row })) } catch { /* fallback */ }
    }
  }
  const all = lsGet(LS_TRIPS, [])
  const idx = all.findIndex(t => t.id === trip.id)
  if (idx >= 0) all.splice(idx, 1, row)
  else all.unshift(row)
  lsSet(LS_TRIPS, all)
}

/** Fetch the full trips row for a given tripId. */
export async function fetchTripRow(tripId) {
  if (!hasSupabase) return null
  try {
    // invite_token is intentionally excluded: it is the write-authorization
    // secret validated server-side only. Returning it to the browser would
    // allow any client that knows the trip ID to read the token and forge
    // write requests, bypassing the server-side validateTripToken check.
    const { data } = await withTimeout(
      supabase
        .from('trips')
        .select('id,title,owner_id,template_type,start_date,end_date,plano,created_at,updated_at')
        .eq('id', tripId)
        .maybeSingle()
    )
    return data ?? null
  } catch { return null }
}

/** Upsert any subset of fields into the trips row (plano, meta, etc.). */
export async function upsertTripRow(tripId, patch) {
  if (!hasSupabase) return
  const token = getEffectiveToken(tripId)
  if (!token) return
  try {
    await withTimeout(apiPatch('/api/trip', { tripId, token, patch }))
  } catch { /* fallback: localStorage only */ }
}

/** Fetch the trip's people from the dedicated `pessoas` table (one row per person). */
export async function fetchPessoas(tripId) {
  if (!hasSupabase) return []
  try {
    const { data } = await withTimeout(
      supabase
        .from('pessoas')
        .select('nome')
        .eq('trip_id', tripId)
        .order('joined_at')
    )
    return Array.isArray(data) ? data.map(r => r.nome) : []
  } catch { return [] }
}

/**
 * Add a person via the API's insert-with-conflict-ignore — a plain unique-constraint
 * INSERT is atomic in Postgres, so two people joining at nearly the same time can
 * never clobber each other (unlike merging a jsonb array client-side, which was
 * reproducibly racy). Returns the resulting full pessoas array.
 */
export async function addPessoaRemote(tripId, nome) {
  if (!hasSupabase) return null
  const token = getEffectiveToken(tripId)
  if (!token) return null
  try {
    await withTimeout(apiWrite('/api/pessoas', { tripId, token, nome }))
    return await fetchPessoas(tripId)
  } catch { return null }
}

export async function removePessoaRemote(tripId, nome) {
  if (!hasSupabase) return null
  const token = getEffectiveToken(tripId)
  if (!token) return null
  try {
    await withTimeout(apiDelete('/api/pessoas', { tripId, token, nome }))
    return await fetchPessoas(tripId)
  } catch { return null }
}

export async function deleteTrip(tripId) {
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiDelete('/api/trip', { tripId, token })) } catch { /* fallback */ }
    }
  }
  const trips = lsGet(LS_TRIPS, []).filter(t => t.id !== tripId)
  lsSet(LS_TRIPS, trips)
}

/* ══════════════════════════════
   SHOPPING ITEMS
══════════════════════════════ */
export async function fetchItems(tripId) {
  if (hasSupabase) {
    try {
      const { data } = await withTimeout(
        supabase
          .from('items')
          .select('id,trip_id,nome,categoria,qtd,comprado,antecipado,assignee,created_at')
          .eq('trip_id', tripId)
          .order('created_at')
      )
      // IMPORTANTE: se o Supabase responder vazio mas tivermos cache local para
      // esta trip, preferimos a cache. Caso contrário o polling de 5s apagava
      // do ecrã items acabados de criar offline.
      const remote = data ?? []
      const local = lsGet(LS_ITEMS, []).filter(i => i.trip_id === tripId)
      if (remote.length === 0 && local.length > 0) return local
      if (remote.length) lsSet(LS_ITEMS, mergeById(lsGet(LS_ITEMS, []), remote, tripId))
      return remote
    } catch {
      // Supabase failed — fallback to localStorage
      return lsGet(LS_ITEMS, []).filter(i => i.trip_id === tripId)
    }
  }
  return lsGet(LS_ITEMS, []).filter(i => i.trip_id === tripId)
}

export async function upsertItem(tripId, item) {
  const row = { ...item, trip_id: tripId }
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiWrite('/api/items', { tripId, token, item: row })) } catch { /* fallback */ }
    }
  }
  const all = lsGet(LS_ITEMS, [])
  const idx = all.findIndex(i => i.id === item.id)
  if (idx >= 0) all.splice(idx, 1, row); else all.push(row)
  lsSet(LS_ITEMS, all)
}

export async function deleteItem(tripId, id) {
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiDelete('/api/items', { tripId, token, id })) } catch { /* fallback */ }
    }
  }
  lsSet(LS_ITEMS, lsGet(LS_ITEMS, []).filter(i => i.id !== id))
}

export async function bulkUpsertItems(tripId, items) {
  const rows = items.map(i => ({ ...i, trip_id: tripId }))
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiWrite('/api/items', { tripId, token, items: rows })) } catch { /* fallback */ }
    }
  }
  lsSet(LS_ITEMS, mergeById(lsGet(LS_ITEMS, []), rows, tripId))
}

/* ══════════════════════════════
   MEALS
══════════════════════════════ */
export async function fetchMeals(tripId) {
  if (hasSupabase) {
    try {
      const { data } = await withTimeout(
        supabase
          .from('meals')
          .select('id,trip_id,nome,emoji,tipo,dia,ingredientes,created_at')
          .eq('trip_id', tripId)
          .order('created_at')
      )
      const remote = data ?? []
      const local = lsGet(LS_MEALS, []).filter(m => m.trip_id === tripId)
      if (remote.length === 0 && local.length > 0) return local
      if (remote.length) lsSet(LS_MEALS, mergeById(lsGet(LS_MEALS, []), remote, tripId))
      return remote
    } catch {
      return lsGet(LS_MEALS, []).filter(m => m.trip_id === tripId)
    }
  }
  return lsGet(LS_MEALS, []).filter(m => m.trip_id === tripId)
}

export async function upsertMeal(tripId, meal) {
  const row = { ...meal, trip_id: tripId }
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiWrite('/api/meals', { tripId, token, meal: row })) } catch { /* fallback */ }
    }
  }
  const all = lsGet(LS_MEALS, [])
  const idx = all.findIndex(m => m.id === meal.id)
  if (idx >= 0) all.splice(idx, 1, row); else all.push(row)
  lsSet(LS_MEALS, all)
}

export async function deleteMeal(tripId, id) {
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiDelete('/api/meals', { tripId, token, id })) } catch { /* fallback */ }
    }
  }
  lsSet(LS_MEALS, lsGet(LS_MEALS, []).filter(m => m.id !== id))
}

/* ══════════════════════════════
   EXPENSES
══════════════════════════════ */
export async function fetchExpenses(tripId) {
  if (hasSupabase) {
    try {
      const { data } = await withTimeout(
        supabase
          .from('expenses')
          .select('id,trip_id,descricao,valor,pago_por,dividir_por,created_at')
          .eq('trip_id', tripId)
          .order('created_at')
      )
      const remote = data ?? []
      const local = lsGet(LS_EXPENSES, []).filter(e => e.trip_id === tripId)
      if (remote.length === 0 && local.length > 0) return local
      if (remote.length) lsSet(LS_EXPENSES, mergeById(lsGet(LS_EXPENSES, []), remote, tripId))
      return remote
    } catch {
      return lsGet(LS_EXPENSES, []).filter(e => e.trip_id === tripId)
    }
  }
  return lsGet(LS_EXPENSES, []).filter(e => e.trip_id === tripId)
}

export async function upsertExpense(tripId, expense) {
  const row = { ...expense, trip_id: tripId }
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiWrite('/api/expenses', { tripId, token, expense: row })) } catch { /* fallback */ }
    }
  }
  const all = lsGet(LS_EXPENSES, [])
  const idx = all.findIndex(e => e.id === expense.id)
  if (idx >= 0) all.splice(idx, 1, row); else all.push(row)
  lsSet(LS_EXPENSES, all)
}

export async function deleteExpense(tripId, id) {
  if (hasSupabase) {
    const token = getEffectiveToken(tripId)
    if (token) {
      try { await withTimeout(apiDelete('/api/expenses', { tripId, token, id })) } catch { /* fallback */ }
    }
  }
  lsSet(LS_EXPENSES, lsGet(LS_EXPENSES, []).filter(e => e.id !== id))
}

/* ══════════════════════════════
   REALTIME subscription
══════════════════════════════ */
export function subscribeTrip(tripId, onItemChange, onMealChange, onExpenseChange, onPessoaChange) {
  if (!hasSupabase) return () => {}

  // NOTA: `supabase.channel(name)` devolve o canal EXISTENTE se já houver um com
  // o mesmo nome. Em React StrictMode (dev) o effect monta duas vezes, e a segunda
  // tentava fazer .on('postgres_changes') num canal já subscrito → o supabase-js
  // atira "cannot add postgres_changes callbacks after subscribe()" e a app inteira
  // crashava para o ErrorBoundary. Usamos um nome único por subscrição e limpamos
  // canais órfãos do mesmo trip.
  supabase.getChannels()
    .filter(ch => ch.topic === `realtime:trip-${tripId}` || ch.topic.startsWith(`realtime:trip-${tripId}:`))
    .forEach(ch => { try { supabase.removeChannel(ch) } catch { /* já removido */ } })

  const channel = supabase.channel(`trip-${tripId}:${Math.random().toString(36).slice(2, 9)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `trip_id=eq.${tripId}` }, onItemChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `trip_id=eq.${tripId}` }, onMealChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, onExpenseChange ?? (() => {}))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pessoas', filter: `trip_id=eq.${tripId}` }, onPessoaChange ?? (() => {}))
    .subscribe()

  return () => { try { supabase.removeChannel(channel) } catch { /* já removido */ } }
}
