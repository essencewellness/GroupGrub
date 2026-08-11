import { useMemo } from 'react'

const KEY = (tripId) => `gg_owner_${tripId}`

export function claimOwner(tripId) {
  if (tripId) localStorage.setItem(KEY(tripId), '1')
}

export function useRole(tripId) {
  const isOwner = useMemo(
    () => tripId ? localStorage.getItem(KEY(tripId)) === '1' : false,
    [tripId]
  )
  return { isOwner, isGuest: !isOwner }
}
