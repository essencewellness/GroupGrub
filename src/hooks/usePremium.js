import { useState, useEffect } from 'react'

const PREMIUM_KEY = 'groupgrub_lifetime_pro'

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem(PREMIUM_KEY) === 'true' } catch { return false }
  })
  const [verifying, setVerifying] = useState(false)

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

    setVerifying(true)
    fetch('/api/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(({ ok }) => {
        if (ok) {
          localStorage.setItem(PREMIUM_KEY, 'true')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
