import { useState, useEffect } from 'react'

const PREMIUM_KEY = 'groupgrub_lifetime_pro'

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    const checkStatus = () => {
      const stored = localStorage.getItem(PREMIUM_KEY)
      if (stored === 'true') {
        setIsPremium(true)
      }
    }

    checkStatus()
    window.addEventListener('storage', checkStatus)
    return () => window.removeEventListener('storage', checkStatus)
  }, [])

  const activatePro = () => {
    localStorage.setItem(PREMIUM_KEY, 'true')
    setIsPremium(true)
  }

  return {
    isPremium,
    activatePro,
    // Com o passe vitalício, nunca expira
    isNearExpiry: false,
  }
}
