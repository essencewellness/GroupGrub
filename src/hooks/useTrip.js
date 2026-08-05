import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { fetchItems, fetchMeals, upsertItem, upsertMeal, deleteItem, deleteMeal, bulkUpsertItems, subscribeTrip } from '../lib/db'
import { hasSupabase } from '../lib/supabase'
import { refeicoes as seedMeals, listaInicial as seedItems } from '../data'

const GROQ_KEY   = import.meta.env.VITE_GROQ_KEY
const LS_TRIP_ID = 'ferias_trip_id'
const PESSOAS    = ['João', 'Maria', 'Pedro', 'Ana', '—']

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
  const [items, setItems]     = useState([])
  const [meals, setMeals]     = useState([])
  const [plano, setPlano]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('ferias_plano')) ?? {} } catch { return {} }
  })
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const seeded = useRef(false)

  // Refs vivas dos dados — permitem que os callbacks (toggleItem, updateMeal,
  // categorizarTudo…) leiam o estado atual sem o listarem nas dependências, e
  // sobretudo evitam fazer efeitos secundários dentro dos updaters do setState
  // (que em StrictMode correm duas vezes e duplicavam/anulavam as escritas).
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  const mealsRef = useRef(meals)
  useEffect(() => { mealsRef.current = meals }, [meals])
  // Ref para quebrar a dependência circular loadData <-> categorizarTudo
  const categorizarRef = useRef(null)

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
      let [dbItems, dbMeals] = await Promise.all([fetchItems(tripId), fetchMeals(tripId)])

      if (isFirst && dbItems.length === 0 && dbMeals.length === 0 && !seeded.current) {
        seeded.current = true
        const ts = Date.now()
        const mealRows = seedMeals.map((m, i) => cleanMeal({ ...m, id: uuid(), created_at: new Date(ts + i).toISOString() }, tripId))
        const itemRows = seedItems.map((it, i) => cleanItem({ ...it, id: uuid(), created_at: new Date(ts + i).toISOString() }, tripId))
        await bulkUpsertItems(tripId, itemRows)
        await Promise.all(mealRows.map(m => upsertMeal(tripId, m)))
        dbItems = itemRows
        dbMeals = mealRows
        setTimeout(() => categorizarRef.current?.(itemRows), 800)
      }

      setItems(dbItems)
      setMeals(dbMeals)
    } catch(e) {
      console.error('loadData error', e)
    } finally {
      if (isFirst) setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    // Wrapped em microtask para não fazer setState síncrono dentro do effect
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) loadData(true) })
    return () => { cancelled = true }
  }, [loadData])

  /* ── polling: refresca a cada 5 segundos para garantir sync ── */
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 5000)
    return () => clearInterval(interval)
  }, [loadData])

  /* ── realtime subscription (bónus — polling é o fallback) ── */
  useEffect(() => {
    const unsub = subscribeTrip(
      tripId,
      ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE') {
          const delId = old?.id || row?.id
          if (delId) setItems(p => p.filter(i => i.id !== delId))
        } else if (row?.id) {
          setItems(p => {
            const idx = p.findIndex(i => i.id === row.id)
            return idx >= 0 ? p.map(i => i.id === row.id ? row : i) : [...p, row]
          })
        }
      },
      ({ eventType, new: row, old }) => {
        if (eventType === 'DELETE') {
          const delId = old?.id || row?.id
          if (delId) setMeals(p => p.filter(m => m.id !== delId))
        } else if (row?.id) {
          setMeals(p => {
            const idx = p.findIndex(m => m.id === row.id)
            return idx >= 0 ? p.map(m => m.id === row.id ? row : m) : [...p, row]
          })
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
  const toggleItem = useCallback(async (id) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item) return
    const updated = cleanItem({ ...item, comprado: !item.comprado }, tripId)
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

  const addItemRaw = useCallback(async (nome, qtd = '') => {
    const newItem = cleanItem({ id: uuid(), nome, qtd, categoria: 'outro', antecipado: false, comprado: false, created_at: new Date().toISOString() }, tripId)
    setItems(p => [...p, newItem])
    await upsertItem(tripId, newItem)
    return newItem
  }, [tripId])

  const addItem = useCallback(async (nome, qtd = '') => {
    const newItem = await addItemRaw(nome, qtd)
    if (!GROQ_KEY) return newItem
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: `Classifica: "${nome}". Só JSON: {"categoria":"duradouro|fresco|congelado|refrigerado","antecipado":true|false}` }], temperature: 0.1, max_tokens: 60 })
      })
      const data = await res.json()
      const match = data.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)
      if (match) {
        const result = JSON.parse(match[0])
        const patched = cleanItem({ ...newItem, ...result }, tripId)
        setItems(p => p.map(i => i.id === newItem.id ? patched : i))
        await upsertItem(tripId, patched)
      }
    } catch (e) {
      console.warn('Auto-categorização falhou para', nome, e)
    }
    return newItem
  }, [tripId, addItemRaw])

  const addIngredientes = useCallback(async (nomes, itemsAtual) => {
    const existentes = new Set((itemsAtual || []).map(i => i.nome.toLowerCase().trim()))
    const novos = nomes.filter(n => !existentes.has(n.toLowerCase().trim()))
    if (!novos.length) return 0

    const newItems = await Promise.all(novos.map(nome => addItemRaw(nome)))
    if (!GROQ_KEY) return novos.length

    try {
      const prompt = `Lista:\n${novos.join('\n')}\n\nClassifica cada um: "congelado","fresco","duradouro","refrigerado". "antecipado":true se aguentar 2+ semanas sem frio.\nSó JSON array:\n[{"nome":"...","categoria":"...","antecipado":true}]`
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 500 })
      })
      const data = await res.json()
      const match = data.choices?.[0]?.message?.content?.match(/\[[\s\S]*\]/)
      if (match) {
        const cats = JSON.parse(match[0])
        const patchedNew = newItems.map(item => {
          const found = cats.find(c => c.nome?.toLowerCase().trim() === item.nome?.toLowerCase().trim())
          return found ? cleanItem({ ...item, categoria: found.categoria, antecipado: found.antecipado }, tripId) : item
        })
        setItems(p => p.map(i => {
          const patched = patchedNew.find(n => n.id === i.id)
          return patched ? patched : i
        }))
        await Promise.all(patchedNew.map(i => upsertItem(tripId, i)))
      }
    } catch (e) {
      console.warn('Categorização de ingredientes falhou', e)
    }

    return novos.length
  }, [tripId, addItemRaw])

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

  /* ══ AI ══ */
  const categorizarTudo = useCallback(async (sourceItems) => {
    const lista = sourceItems ?? itemsRef.current
    if (!lista.length) return
    if (!GROQ_KEY) { console.warn('VITE_GROQ_KEY em falta — categorização AI desativada'); return }
    setAiLoading(true)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: `Lista compras:\n${lista.map(i => i.nome).join('\n')}\n\nClassifica: "congelado","fresco","duradouro","refrigerado". "antecipado":true se 2+ semanas sem frio.\nSó JSON:\n[{"nome":"...","categoria":"...","antecipado":true/false}]` }],
          temperature: 0.1, max_tokens: 2000,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      const match = data.choices[0].message.content.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('parse error')
      const cats = JSON.parse(match[0])
      const patched = lista.map(item => {
        const found = cats.find(c => c.nome?.toLowerCase().trim() === item.nome?.toLowerCase().trim())
        return found ? cleanItem({ ...item, categoria: found.categoria, antecipado: found.antecipado }, tripId) : item
      })
      setItems(patched)
      await Promise.all(patched.map(i => upsertItem(tripId, i)))
    } catch (e) {
      console.error('Groq error', e)
    } finally {
      setAiLoading(false)
    }
  }, [tripId])

  // Liga a ref usada pelo seed inicial (evita TDZ / dependência circular)
  useEffect(() => { categorizarRef.current = categorizarTudo }, [categorizarTudo])

  const updatePlano = useCallback((slotKey, selection) => {
    setPlano(prev => {
      const next = { ...prev, [slotKey]: selection }
      localStorage.setItem('ferias_plano', JSON.stringify(next))
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    await loadData(false)
  }, [loadData])

  return {
    tripId, loading, aiLoading, hasSupabase,
    setTripId,
    items, toggleItem, updateItem, addItem, addIngredientes, removeItem, resetTicks, categorizarTudo,
    meals, addMeal, updateMeal, removeMeal,
    plano, updatePlano,
    refresh,
    pessoas: PESSOAS,
    shareUrl: `${window.location.origin}${window.location.pathname}?trip=${tripId}`,
  }
}
