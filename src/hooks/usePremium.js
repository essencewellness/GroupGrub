import { useState, useEffect } from 'react'

const PREMIUM_KEY = 'groupgrub_lifetime_pro'

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem(PREMIUM_KEY) === 'true' } catch { return false }
  })
  const [verifying, setVerifying] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    const needsVerify = p.get('paid') === 'true' && !!p.get('session_id')
    const alreadyPremium = localStorage.getItem(PREMIUM_KEY) === 'true'
    return needsVerify && !alreadyPremium
  })

  // Verifica sessão Stripe após redirect de pagamento bem-sucedido
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paid = params.get('paid')
    const sessionId = params.get('session_id')

    if (paid !== 'true' || !sessionId) return
    if (isPremium) {
      // Já era premium — limpa a URL
      const url = new URL(window.location)
      url.searchParams.delete('paid')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url)
      return
    }

    fetch('/api/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(({ ok, email }) => {
        if (ok) {
          localStorage.setItem(PREMIUM_KEY, 'true')
          if (email) localStorage.setItem('groupgrub_user_email', email)
          setIsPremium(true)
        }
      })
      .catch(() => {})
      .finally(() => {
        setVerifying(false)
        // Limpa ?paid=true&session_id= da URL
        const url = new URL(window.location)
        url.searchParams.delete('paid')
        url.searchParams.delete('session_id')
        window.history.replaceState({}, '', url)
      })
  // intentionally empty deps — Stripe redirect verification runs once on mount only
  }, [])

  // Escuta alterações entre abas
  useEffect(() => {
    const onStorage = () => setIsPremium(localStorage.getItem(PREMIUM_KEY) === 'true')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const activatePro = () => {
    localStorage.setItem(PREMIUM_KEY, 'true')
    setIsPremium(true)
  }

  return { isPremium, verifying, activatePro, isNearExpiry: false }
}
