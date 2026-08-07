import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { fetchItems, fetchMeals, upsertItem, upsertMeal, deleteItem, deleteMeal, bulkUpsertItems, subscribeTrip, fetchExpenses, upsertExpense, deleteExpense, fetchTripPessoas, upsertTripPessoas } from '../lib/db'
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
export function buildTripStructure(startDate, endDate) {
  if (!startDate || !endDate) return []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  if (isNaN(start) || isNaN(end) || end < start) return []
  const days = []
  const cursor = new Date(start)
  const endStr = end.toISOString().slice(0, 10)
  while (cursor <= end) {
    const dow = cursor.getDay()
    const dateStr = cursor.toISOString().slice(0, 10)
    const isFirst = dateStr === start.toISOString().slice(0, 10)
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

export default function useTrip() {
  // Lazy init: getTripId() só corre UMA vez (antes corria em cada render,
  // escrevendo localStorage + history.replaceState repetidamente)
  const [tripId] = useState(getTripId)
  const [items, setItems]         = useState([])
  const [meals, setMeals]         = useState([])
  const [expenses, setExpenses]   = useState([])
  const [pessoas, setPessoas]     = useState(() => {
    // Read tripId from storage directly — cannot reference the state above yet
    const id = new URLSearchParams(window.location.search).get('trip')
         || localStorage.getItem('ferias_trip_id')
         || ''
    return loadPessoas(id)
  })
  const [plano, setPlano]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('ferias_plano')) ?? {} } catch { return {} }
  })
  const [meta, setMeta]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('ferias_meta')) ?? null } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Refs vivas dos dados — permitem que os callbacks (toggleItem, updateMeal,
  // categorizarTudo…) leiam o estado atual sem o listarem nas dependências, e
  // sobretudo evitam fazer efeitos secundários dentro dos updaters do setState
  // (que em StrictMode correm duas vezes e duplicavam/anulavam as escritas).
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  const mealsRef = useRef(meals)
  useEffect(() => { mealsRef.current = meals }, [meals])

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
      const [dbItems, dbMeals, dbExpenses] = await Promise.all([
        fetchItems(tripId), fetchMeals(tripId), fetchExpenses(tripId)
      ])
      setItems(dbItems)
      setMeals(dbMeals)
      setExpenses(dbExpenses)
      // Sync pessoas from Supabase non-blocking (no await — doesn't block render)
      fetchTripPessoas(tripId).then(remotePessoas => {
        if (remotePessoas && remotePessoas.length > 0) {
          setPessoas(prev => {
            const merged = [...new Set([...remotePessoas, ...prev])]
            savePessoas(tripId, merged)
            return merged
          })
        }
      }).catch(() => {})
    } catch (e) {
      console.error('loadData error', e)
    } finally {
      if (isFirst) setLoading(false)
    }
  }, [tripId])


  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) loadData(true) })
    return () => { cancelled = true }
  }, [loadData])

  // On load, push local pessoas to Supabase so guests can sync them
  useEffect(() => {
    const local = loadPessoas(tripId)
    if (local.length > 0) upsertTripPessoas(tripId, local).catch(() => {})
  }, [tripId])

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
    // Gera os slots Almoço/Jantar por dia no range de datas
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
    localStorage.setItem('ferias_meta', JSON.stringify(nextMeta))
    localStorage.setItem('ferias_plano', JSON.stringify({ ...generated, ...JSON.parse(localStorage.getItem('ferias_plano') || '{}') }))
  }, [])

  const updatePlano = useCallback((slotKey, selection) => {
    setPlano(prev => {
      const next = { ...prev, [slotKey]: selection }
      localStorage.setItem('ferias_plano', JSON.stringify(next))
      return next
    })
  }, [])

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

  const addPessoa = useCallback((nome) => {
    if (!nome.trim()) return
    setPessoas(prev => {
      if (prev.includes(nome.trim())) return prev
      const next = [...prev, nome.trim()]
      savePessoas(tripId, next)
      upsertTripPessoas(tripId, next)
      return next
    })
  }, [tripId])

  const removePessoa = useCallback((nome) => {
    setPessoas(prev => {
      const next = prev.filter(p => p !== nome)
      savePessoas(tripId, next)
      upsertTripPessoas(tripId, next)
      return next
    })
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
