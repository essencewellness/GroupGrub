import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { fetchItems, fetchMeals, upsertItem, upsertMeal, deleteItem, deleteMeal, bulkUpsertItems, subscribeTrip, fetchExpenses, upsertExpense, deleteExpense, fetchTripRow, upsertTripRow, fetchPessoas, addPessoaRemote, removePessoaRemote } from '../lib/db'
import { hasSupabase } from '../lib/supabase'
import { categorizeItem } from '../lib/categorizer'

// Re-exporta para componentes que importam do useTrip
export { CATEGORIA_PADRAO } from '../lib/categorizer'

const LS_TRIP_ID = 'ferias_trip_id'

function pessoasKey(tripId) { return `ferias_pessoas_${tripId}` }
function loadPessoas(tripId) {
  try {
    const saved = JSON.parse(localStorage.getItem(pessoasKey(tripId)) || '[]')
    if (saved.length === 0) {
      const ownerName = localStorage.getItem('groupgrub_user_name')
        || localStorage.getItem('groupgrub_guest_name')
      if (ownerName) {
        // Persist so the auto-push to Supabase actually sends it
        savePessoas(tripId, [ownerName])
        return [ownerName]
      }
    }
    return saved
  } catch { return [] }
}
function savePessoas(tripId, arr) {
  try { localStorage.setItem(pessoasKey(tripId), JSON.stringify(arr)) } catch { /* quota */ }
}

const WEEKDAY_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const WEEKDAY_EMOJI = ['🌅', '🌤️', '⛅', '🌥️', '🌞', '🌆', '☀️']

// Gera a estrutura de dias (Almoço + Jantar) a partir de um range de datas.
// Cada dia: { id, label, emoji, slots: ['almoco','jantar'] }
function localDateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function buildTripStructure(startDate, endDate) {
  if (!startDate || !endDate) return []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  if (isNaN(start) || isNaN(end) || end < start) return []
  const days = []
  const cursor = new Date(start)
  const startStr = localDateStr(start)
  const endStr = localDateStr(end)
  while (localDateStr(cursor) <= endStr) {
    const dow = cursor.getDay()
    const dateStr = localDateStr(cursor)
    const isFirst = dateStr === startStr
    const isLast  = dateStr === endStr
    // Arrival day: no lunch (still travelling); Departure day: no dinner (already leaving)
    const slots = isFirst && isLast ? ['almoco', 'jantar']
                : isFirst           ? ['jantar']
                : isLast            ? ['almoco']
                :                    ['almoco', 'jantar']
    days.push({
      id: 'd' + dateStr,
      label: WEEKDAY_PT[dow],
      date: dateStr,
      emoji: WEEKDAY_EMOJI[dow],
      slots,
    })
    cursor.setDate(cursor.getDate() + 1)
    if (days.length > 60) break // safety: max 60 days
  }
  return days
}

function getTripId() {
  // 1. Tenta query param ?trip= (prioritário — vem de links partilhados)
  const params = new URLSearchParams(window.location.search)
  const queryTrip = params.get('trip')
  if (queryTrip && queryTrip.length >= 6) {
    localStorage.setItem(LS_TRIP_ID, queryTrip)
    sessionStorage.setItem(LS_TRIP_ID, queryTrip)
    return queryTrip
  }

  // 2. Tenta hash compat (migration antiga)
  const hash = window.location.hash.replace('#', '').trim()
  if (hash && hash.length >= 6) {
    localStorage.setItem(LS_TRIP_ID, hash)
    sessionStorage.setItem(LS_TRIP_ID, hash)
    const url = new URL(window.location)
    url.searchParams.set('trip', hash)
    url.hash = ''
    window.history.replaceState({}, '', url)
    return hash
  }

  // 3. Tenta localStorage (PWA instalada — URL pode ser resetada)
  let id = localStorage.getItem(LS_TRIP_ID)
  if (!id && typeof window !== 'undefined') {
    id = sessionStorage.getItem(LS_TRIP_ID)  // fallback para navegadores com localStorage bloqueado
  }
  if (!id) {
    id = uuid().slice(0, 8)
    localStorage.setItem(LS_TRIP_ID, id)
    sessionStorage.setItem(LS_TRIP_ID, id)
  }

  // 4. Sincroniza o URL para garantir consistência PWA
  const url = new URL(window.location)
  url.searchParams.set('trip', id)
  window.history.replaceState({}, '', url)
  return id
}

// Limpa campos que não existem na DB
function cleanItem(item, tripId) {
  return {
    id: item.id,
    trip_id: tripId,
    nome: item.nome,
    qtd: item.qtd || '',
    categoria: item.categoria || 'outro',
    antecipado: item.antecipado || false,
    comprado: item.comprado || false,
    assignee: item.assignee || '',
    created_at: item.created_at || new Date().toISOString(),
  }
}

function cleanMeal(meal, tripId) {
  return {
    id: meal.id,
    trip_id: tripId,
    nome: meal.nome,
    emoji: meal.emoji || '🍽️',
    tipo: meal.tipo || '',
    ingredientes: meal.ingredientes || [],
    created_at: meal.created_at || new Date().toISOString(),
  }
}

// Resolved once at import time — shared across all useState initializers below
const _INITIAL_TRIP_ID = new URLSearchParams(window.location.search).get('trip')
  || localStorage.getItem('ferias_trip_id')
  || ''

export default function useTrip() {
  // Lazy init: getTripId() só corre UMA vez (antes corria em cada render,
  // escrevendo localStorage + history.replaceState repetidamente)
  const [tripId] = useState(getTripId)
  const [items, setItems]         = useState([])
  const [meals, setMeals]         = useState([])
  const [expenses, setExpenses]   = useState([])
  const [pessoas, setPessoas]     = useState(() => loadPessoas(_INITIAL_TRIP_ID))
  const [plano, setPlano]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ferias_plano_${_INITIAL_TRIP_ID}`)) ?? {} } catch { return {} }
  })
  const [meta, setMeta]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(`ferias_meta_${_INITIAL_TRIP_ID}`)) ?? null } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Refs vivas dos dados — permitem que os callbacks (toggleItem, updateMeal,
  // categorizarTudo…) leiam o estado atual sem o listarem nas dependências, e
  // sobretudo evitam fazer efeitos secundários dentro dos updaters do setState
  // (que em StrictMode correm duas vezes e duplicavam/anulavam as escritas).
  const isMountedRef = useRef(true)
  useEffect(() => { return () => { isMountedRef.current = false } }, [])

  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  const mealsRef = useRef(meals)
  useEffect(() => { mealsRef.current = meals }, [meals])
  const pessoasRef = useRef(pessoas)
  useEffect(() => { pessoasRef.current = pessoas }, [pessoas])
  const planoRef = useRef(plano)
  useEffect(() => { planoRef.current = plano }, [plano])

  /** Switch to a different trip — updates localStorage/sessionStorage/URL then reloads */
  const setTripId = useCallback((newId) => {
    if (!newId || newId.length < 6) return
    localStorage.setItem(LS_TRIP_ID, newId)
    sessionStorage.setItem(LS_TRIP_ID, newId)
    const url = new URL(window.location)
    url.searchParams.set('trip', newId)
    window.history.replaceState({}, '', url)
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('trip-change', { detail: newId }))
    // Reload so useRef trips to new ID
    window.location.reload()
  }, [])

  /* ── load data ── */
  const loadData = useCallback(async (isFirst = false) => {
    try {
      const [dbItems, dbMeals, dbExpenses, dbPessoas, row] = await Promise.all([
        fetchItems(tripId), fetchMeals(tripId), fetchExpenses(tripId), fetchPessoas(tripId), fetchTripRow(tripId)
      ])
      setItems(dbItems)
      setMeals(dbMeals)
      setExpenses(dbExpenses)
      if (dbPessoas.length > 0) {
        setPessoas(prev => {
          const merged = [...new Set([...dbPessoas, ...prev])]
          savePessoas(tripId, merged)
          return merged
        })
      }
      // Restore meta/plano from Supabase — this must resolve BEFORE loading flips
      // to false, otherwise needsSetup (computed from meta) briefly reads "no meta
      // yet" on a guest opening an existing trip's link and flashes the "create
      // trip" wizard on top of the name prompt (confirmed reproducible).
      if (isMountedRef.current && row) {
        // Restore meta (start/end dates) if localStorage was wiped
        if (row.start_date && row.end_date) {
          setMeta(prev => {
            if (prev?.startDate) return prev  // localStorage still intact
            const restored = {
              title: row.title,
              startDate: row.start_date,
              endDate: row.end_date,
              structure: buildTripStructure(row.start_date, row.end_date),
            }
            localStorage.setItem(`ferias_meta_${tripId}`, JSON.stringify(restored))
            return restored
          })
        }
        // Restore plano if localStorage was wiped
        if (row.plano && Object.keys(row.plano).length > 0) {
          setPlano(prev => {
            if (Object.keys(prev).length > 0) return prev  // localStorage still intact
            localStorage.setItem(`ferias_plano_${tripId}`, JSON.stringify(row.plano))
            return row.plano
          })
        }
      }
    } catch (e) {
      console.warn('loadData error', e)
    } finally {
      if (isFirst) setLoading(false)
    }
  }, [tripId])


  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) loadData(true) })
    return () => { cancelled = true }
  }, [loadData])

  // NOTE: pessoas sync-to-server used to also happen here on every mount,
  // pushing whatever this device had locally. Removed — it raced with
  // loadData's server-merge above (see C-6-esque bug: a freshly-joined
  // device could push its own name before merging the server's list,
  // silently dropping anyone else already on the trip). addPessoa() now
  // merges with the server before writing, which is the only place a name
  // actually needs to be pushed.

  /* ── polling: refresca a cada 5 segundos SÓ quando Supabase Realtime não está ativo (fallback offline) ── */
  useEffect(() => {
    if (hasSupabase) return // Realtime cobre updates — polling redundante
    const interval = setInterval(() => loadData(false), 5000)
    return () => clearInterval(interval)
  }, [loadData])

  /* ── realtime subscription ── */
  useEffect(() => {
    const unsub = subscribeTrip(
      tripId,
      ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE') {
          const delId = old?.id || row?.id
          if (delId) setItems(p => p.filter(i => i.id !== delId))
        } else if (row?.id) {
          setItems(p => { const idx = p.findIndex(i => i.id === row.id); return idx >= 0 ? p.map(i => i.id === row.id ? row : i) : [...p, row] })
        }
      },
      ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE') {
          const delId = old?.id || row?.id
          if (delId) setMeals(p => p.filter(m => m.id !== delId))
        } else if (row?.id) {
          setMeals(p => { const idx = p.findIndex(m => m.id === row.id); return idx >= 0 ? p.map(m => m.id === row.id ? row : m) : [...p, row] })
        }
      },
      ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE') {
          const delId = old?.id || row?.id
          if (delId) setExpenses(p => p.filter(e => e.id !== delId))
        } else if (row?.id) {
          setExpenses(p => { const idx = p.findIndex(e => e.id === row.id); return idx >= 0 ? p.map(e => e.id === row.id ? row : e) : [...p, row] })
        }
      },
      ({ eventType, new: row, old }) => {
        const nome = row?.nome || old?.nome
        if (!nome) return
        setPessoas(p => {
          const next = eventType === 'DELETE' ? p.filter(n => n !== nome) : (p.includes(nome) ? p : [...p, nome])
          savePessoas(tripId, next)
          return next
        })
      }
    )
    return unsub
  }, [tripId])

  /* ── refresca quando volta ao foco (PWA/mobile) ── */
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadData])

  /* ══ ITEMS ══ */
  // NOTA: nunca fazer efeitos secundários (escrita em DB) dentro do updater do
  // setState — em StrictMode o updater corre DUAS vezes e o upsert gravava o
  // valor invertido duas vezes, anulando o toggle. Calculamos a partir do ref e
  // só depois gravamos, uma única vez.
  const toggleItem = useCallback(async (id, buyerName) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item) return
    const nowBought = !item.comprado
    const updated = cleanItem({
      ...item,
      comprado: nowBought,
      assignee: nowBought ? (buyerName || item.assignee || '') : '',
    }, tripId)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    await upsertItem(tripId, updated)
  }, [tripId])

  const updateItem = useCallback(async (id, patch) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item) return
    const updated = cleanItem({ ...item, ...patch }, tripId)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    await upsertItem(tripId, updated)
  }, [tripId])

  const addItem = useCallback(async (nome, qtd = '') => {
    const { categoria, antecipado } = categorizeItem(nome)
    const newItem = cleanItem({ id: uuid(), nome, qtd, categoria, antecipado, comprado: false, created_at: new Date().toISOString() }, tripId)
    setItems(p => [...p, newItem])
    await upsertItem(tripId, newItem)
    return newItem
  }, [tripId])

  const addIngredientes = useCallback(async (nomes, itemsAtual) => {
    const existentes = new Set((itemsAtual || []).map(i => i.nome.toLowerCase().trim()))
    const novos = nomes.filter(n => !existentes.has(n.toLowerCase().trim()))
    if (!novos.length) return 0

    const newItems = novos.map(nome => {
      const { categoria, antecipado } = categorizeItem(nome)
      return cleanItem({ id: uuid(), nome, qtd: '', categoria, antecipado, comprado: false, created_at: new Date().toISOString() }, tripId)
    })
    setItems(p => [...p, ...newItems])
    await bulkUpsertItems(tripId, newItems)
    return novos.length
  }, [tripId])

  const removeItem = useCallback(async (id) => {
    setItems(p => p.filter(i => i.id !== id))
    await deleteItem(tripId, id)
  }, [tripId])

  const resetTicks = useCallback(async () => {
    const updated = itemsRef.current.map(i => cleanItem({ ...i, comprado: false }, tripId))
    setItems(updated)
    await bulkUpsertItems(tripId, updated)
  }, [tripId])

  /* ══ MEALS ══ */
  const addMeal = useCallback(async (meal) => {
    const row = cleanMeal({ ...meal, id: uuid(), created_at: new Date().toISOString() }, tripId)
    setMeals(p => [...p, row])
    await upsertMeal(tripId, row)
    return row
  }, [tripId])

  const updateMeal = useCallback(async (id, patch) => {
    const meal = mealsRef.current.find(m => m.id === id)
    if (!meal) return
    const updated = cleanMeal({ ...meal, ...patch }, tripId)
    setMeals(prev => prev.map(m => m.id === id ? updated : m))
    await upsertMeal(tripId, updated)
  }, [tripId])

  const removeMeal = useCallback(async (id) => {
    setMeals(p => p.filter(m => m.id !== id))
    await deleteMeal(tripId, id)
  }, [tripId])

  /* ══ CATEGORIZAÇÃO LOCAL ══ */
  const categorizarTudo = useCallback(async (sourceItems) => {
    const lista = sourceItems ?? itemsRef.current
    if (!lista.length) return
    const patched = lista.map(item => {
      const { categoria, antecipado } = categorizeItem(item.nome)
      return cleanItem({ ...item, categoria, antecipado }, tripId)
    })
    setItems(patched)
    await bulkUpsertItems(tripId, patched)
  }, [tripId])

  // ── Wizard: configurar meta da viagem e gerar slots automaticamente ──
  const setTripMeta = useCallback((newMeta) => {
    const structure = buildTripStructure(newMeta.startDate, newMeta.endDate)
    const generated = {}
    structure.forEach((dia) => {
      dia.slots.forEach((slot) => {
        generated[`${dia.id}-${slot}`] = {}
      })
    })
    const nextMeta = { ...newMeta, structure }
    setMeta(nextMeta)
    setPlano((prev) => ({ ...generated, ...prev }))
    localStorage.setItem(`ferias_meta_${tripId}`, JSON.stringify(nextMeta))
    localStorage.setItem(`ferias_plano_${tripId}`, JSON.stringify({ ...generated, ...JSON.parse(localStorage.getItem(`ferias_plano_${tripId}`) || '{}') }))
    // Persist dates + title to Supabase so they survive browser wipe
    upsertTripRow(tripId, {
      title: newMeta.title || 'Nova Viagem',
      start_date: newMeta.startDate,
      end_date: newMeta.endDate,
    }).catch(() => {})
  }, [tripId])

  const updatePlano = useCallback((slotKey, selection) => {
    const next = { ...planoRef.current, [slotKey]: selection }
    localStorage.setItem(`ferias_plano_${tripId}`, JSON.stringify(next))
    setPlano(next)
    upsertTripRow(tripId, { plano: next }).catch(() => {})
  }, [tripId])

  /* ══ EXPENSES ══ */
  const addExpense = useCallback(async (exp) => {
    const row = { ...exp, id: exp.id || uuid(), trip_id: tripId, created_at: exp.created_at || new Date().toISOString() }
    setExpenses(p => [...p, row])
    await upsertExpense(tripId, row)
    return row
  }, [tripId])

  const removeExpense = useCallback(async (id) => {
    setExpenses(p => p.filter(e => e.id !== id))
    await deleteExpense(tripId, id)
  }, [tripId])

  const addPessoa = useCallback(async (nome) => {
    const trimmed = nome.trim()
    if (!trimmed || pessoasRef.current.includes(trimmed)) return
    const next = [...pessoasRef.current, trimmed]
    savePessoas(tripId, next)
    setPessoas(next)
    // Insert into the dedicated `pessoas` table (unique constraint on trip_id+nome)
    // instead of read-merge-write on a jsonb array — a plain INSERT is atomic in
    // Postgres, so two people joining within the same window can never clobber
    // each other's write (confirmed reproducible with the old jsonb approach).
    const serverPessoas = await addPessoaRemote(tripId, trimmed)
    if (serverPessoas) {
      savePessoas(tripId, serverPessoas)
      setPessoas(serverPessoas)
    }
  }, [tripId])

  const removePessoa = useCallback(async (nome) => {
    const next = pessoasRef.current.filter(p => p !== nome)
    savePessoas(tripId, next)
    setPessoas(next)
    const serverPessoas = await removePessoaRemote(tripId, nome)
    if (serverPessoas) {
      savePessoas(tripId, serverPessoas)
      setPessoas(serverPessoas)
    }
  }, [tripId])

  const refresh = useCallback(async () => {
    await loadData(false)
  }, [loadData])

  return {
    tripId, loading, hasSupabase,
    setTripId,
    items, toggleItem, updateItem, addItem, addIngredientes, removeItem, resetTicks, categorizarTudo,
    meals, addMeal, updateMeal, removeMeal,
    expenses, addExpense, removeExpense,
    plano, updatePlano,
    meta, setTripMeta,
    needsSetup: !meta || !meta.startDate || !meta.endDate,
    structure: meta?.structure || null,
    refresh,
    pessoas, addPessoa, removePessoa,
    shareUrl: `${window.location.origin}${window.location.pathname}?trip=${tripId}`,
  }
}
