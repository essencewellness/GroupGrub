import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

const LS_KEY = 'ferias_user'

/**
 * Auth hook — 1 app só.
 * Uses Supabase when configured, mock localStorage otherwise.
 * No multi-version, no branching — same code runs everywhere (web, PWA, app store wrapper).
 */
export function useAuth() {
  // Estado inicial derivado do localStorage no initializer (sem setState no effect).
  // Sem Supabase configurado usamos já o utilizador mock aqui — evita um render extra
  // e o anti-padrão de setState síncrono dentro do effect.
  const [user, setUser] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY))
      if (cached) return cached
    } catch { try { localStorage.removeItem(LS_KEY) } catch { /* private browsing */ } }
    if (!hasSupabase) {
      const mock = { id: 'mock-user', email: 'dev@local', name: 'Dev' }
      try { localStorage.setItem(LS_KEY, JSON.stringify(mock)) } catch { /* quota */ }
      return mock
    }
    return null
  })
  // Só ficamos em loading se houver Supabase e ainda não tivermos utilizador.
  const [loading, setLoading] = useState(() => hasSupabase && !user)

  useEffect(() => {
    if (user || !hasSupabase) return
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user: remote } }) => {
      if (cancelled) return
      if (remote) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(remote)) } catch { /* quota */ }
      }
      setUser(remote)
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = async (email, password) => {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data.user) {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data.user)) } catch { /* quota */ }
        setUser(data.user)
      }
      return { user: data.user, error }
    }

    // Mock dev mode — simulates login without backend
    const mockUser = { id: `mock-${Date.now()}`, email, name: email.split('@')[0] }
    try { localStorage.setItem(LS_KEY, JSON.stringify(mockUser)) } catch { /* quota */ }
    setUser(mockUser)
    return { user: mockUser }
  }

  const signUp = async (email, password) => {
    if (hasSupabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      })
      return { user: data?.user, error }
    }

    // Mock — same as sign-in
    return signIn(email, password)
  }

  // FIX: signOut is now async and awaits supabase.auth.signOut() to prevent an
  // unhandled floating promise rejection when the Supabase call fails.
  const signOut = async () => {
    if (hasSupabase) {
      try { await supabase.auth.signOut() } catch { /* ignore sign-out errors */ }
    }
    try { localStorage.removeItem(LS_KEY) } catch { /* private browsing */ }
    setUser(null)
  }

  return { user, loading, signIn, signUp, signOut }
}
