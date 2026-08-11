const LS_KEY = (tripId) => `ferias_invite_${tripId}`

/** Returns the invite key for a trip, generating and saving one if it doesn't exist yet. */
export function getOrCreateInviteKey(tripId) {
  if (!tripId) return ''
  const existing = localStorage.getItem(LS_KEY(tripId))
  if (existing) return existing
  const key = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  localStorage.setItem(LS_KEY(tripId), key)
  return key
}

/** Returns existing invite key or empty string (does NOT generate). */
export function getInviteKey(tripId) {
  if (!tripId) return ''
  return localStorage.getItem(LS_KEY(tripId)) || ''
}

/** Builds the full shareable URL including key. Uses current origin (works in any env). */
export function buildInviteUrl(tripId) {
  const key = getOrCreateInviteKey(tripId)
  return `${window.location.origin}/?trip=${tripId}&key=${key}`
}
