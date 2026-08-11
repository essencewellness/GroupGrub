/* global process */

export const config = { runtime: 'edge' }

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''
}

export function adminHeaders(extra = {}) {
  const key = serviceKey()
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  }
}

export function jsonOk(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function jsonErr(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Validates token against trips.invite_token.
 * If invite_token is NULL in DB, bootstraps it (first write from owner).
 * Returns { valid: boolean, reason?: string }
 */
export async function validateTripToken(tripId, token) {
  if (!tripId || !token) return { valid: false, reason: 'missing tripId or token' }

  const base = supabaseUrl()
  const headers = adminHeaders()

  const res = await fetch(
    `${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=invite_token`,
    { headers }
  )
  const rows = await res.json().catch(() => null)

  if (!Array.isArray(rows) || rows.length === 0) {
    // Trip doesn't exist yet — first write will create it, allow
    return { valid: true }
  }

  const stored = rows[0].invite_token

  if (!stored) {
    // Bootstrap: persist token on first write
    await fetch(`${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}`, {
      method: 'PATCH',
      headers: adminHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify({ invite_token: token }),
    }).catch(() => {})
    return { valid: true }
  }

  if (stored !== token) return { valid: false, reason: 'invalid token' }
  return { valid: true }
}

export { supabaseUrl, serviceKey }
