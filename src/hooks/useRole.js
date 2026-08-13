import { useMemo } from 'react'

const KEY = (tripId) => `gg_owner_${tripId}`

export function claimOwner(tripId) {
  if (!tripId) return
  try { localStorage.setItem(KEY(tripId), '1') } catch { /* quota / private browsing */ }
}

export function useRole(tripId) {
  const isOwner = useMemo(() => {
    if (!tripId) return false
    try { return localStorage.getItem(KEY(tripId)) === '1' } catch { return false }
  }, [tripId])
  return { isOwner, isGuest: !isOwner }
}
