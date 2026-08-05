import { useEffect, useState } from "react"

/**
 * Premium hook — 1 app só.
 * Mock: localStorage check. Ready for Stripe/Supabase when scaled.
 */

const PREMIUM_KEY = "ferias_premium"

export function usePremium() {
  // Lê o localStorage no initializer — evita setState síncrono dentro do effect
  // (causava um render em cascata e um flash de "não-premium")
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem(PREMIUM_KEY) === "paid" } catch { return false }
  })
  const [loading] = useState(false)

  useEffect(() => {
    // Listen for storage changes (cross-tab sync)
    const handler = () => {
      const v = localStorage.getItem(PREMIUM_KEY)
      setIsPremium(v === "paid")
    }
    window.addEventListener("storage", handler)
    window.addEventListener("premium-upgraded", handler)
    return () => {
      window.removeEventListener("storage", handler)
      window.removeEventListener("premium-upgraded", handler)
    }
  }, [])

  return { isPremium, loading, setIsPremium }
}

/**
 * Upgrade to premium — mock mode (1 app só).
 * When Stripe is ready, replace the localStorage line with:
 *   const stripe = await stripePromise
 *   await stripe.redirectToCheckout({ ... })
 */
export function upgradeToPremium() {
  localStorage.setItem(PREMIUM_KEY, "paid")
  localStorage.setItem("ferias_upgrade_ts", Date.now().toString())
  window.dispatchEvent(new CustomEvent("premium-upgraded"))
  return true
}

/**
 * Check if a user has been premium for X days (future expiry model)
 */
export function isNearExpiry() {
  const ts = localStorage.getItem("ferias_upgrade_ts")
  if (!ts) return false
  const days = (Date.now() - parseInt(ts)) / (1000 * 60 * 60 * 24)
  return days > 365 // 1 year grace period
}
