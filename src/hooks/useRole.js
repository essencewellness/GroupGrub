// Role detection: owner vs guest.
// Owner = whoever created the trip (has localStorage flag).
// Guest = anyone who opened a shared link without the flag.
// No auth required — simplest possible implementation.

const KEY = (tripId) => `gg_owner_${tripId}`

export function claimOwner(tripId) {
  if (tripId) localStorage.setItem(KEY(tripId), '1')
}

export function useRole(tripId) {
  const isOwner = tripId ? localStorage.getItem(KEY(tripId)) === '1' : false
  return { isOwner, isGuest: !isOwner }
}
