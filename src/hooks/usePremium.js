import { useState, useEffect } from 'react'

const PREMIUM_KEY = 'groupgrub_lifetime_pro'

function lsGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, value) } catch { /* quota / private browsing */ }
}

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(() => lsGet(PREMIUM_KEY) === 'true')
  const [verifying, setVerifying] = useState(() => {
    const p = new URLSearchParams(window.location.search)
    const needsVerify = p.get('paid') === 'true' && !!p.get('session_id')
    // FIX: previously accessed localStorage directly without try/catch here.
    const alreadyPremium = lsGet(PREMIUM_KEY) === 'true'
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
          lsSet(PREMIUM_KEY, 'true')
          if (email) lsSet('groupgrub_user_email', email)
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
  }, []) // intentionally empty — Stripe redirect verification runs once on mount only

  // Escuta alterações entre abas
  useEffect(() => {
    const onStorage = () => setIsPremium(lsGet(PREMIUM_KEY) === 'true')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // FIX: localStorage.setItem previously had no try/catch — can throw in private browsing.
  const activatePro = () => {
    lsSet(PREMIUM_KEY, 'true')
    setIsPremium(true)
  }

  return { isPremium, verifying, activatePro }
}
