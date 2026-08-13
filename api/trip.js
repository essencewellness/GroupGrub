import { validateTripToken, adminHeaders, jsonOk, jsonErr, supabaseUrl } from './_lib/adminClient.js'

export const config = { runtime: 'edge' }

// Allowed top-level columns a client may write/patch on the trips table.
// invite_token and id are set server-side only; owner_id and created_at must never be client-writable.
const ALLOWED_TRIP_FIELDS = ['title', 'pessoas', 'plano', 'meta', 'start_date', 'end_date', 'currency', 'note', 'premium', 'settings']

function sanitizeTrip(raw) {
  const out = {}
  for (const k of ALLOWED_TRIP_FIELDS) if (k in raw) out[k] = raw[k]
  return out
}

export default async function handler(req) {
  const base = supabaseUrl()

  // GET /api/trip?tripId=X (+ optional X-Invite-Key header) — public read, no
  // token needed for the base row (RLS SELECT is open). invite_token is fetched
  // (service_role bypasses the anon column REVOKE) but is NEVER included in the
  // response — only used server-side to compute `keyValid`, so the browser can
  // decide guest-mode vs paywall without ever learning the real write secret.
  // The key travels as a header, not a query param, so it doesn't end up in
  // access logs or any edge/CDN caching keyed on the URL.
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const tripId = url.searchParams.get('tripId')
    const key = req.headers.get('x-invite-key')
    if (!tripId) return jsonErr('tripId required')
    const res = await fetch(
      `${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=*`,
      { headers: adminHeaders() }
    )
    const rows = await res.json().catch(() => [])
    const row = Array.isArray(rows) ? rows[0] ?? null : null
    if (!row) return jsonOk(null)
    const { invite_token, ...safeRow } = row
    if (key !== null) safeRow.keyValid = !!invite_token && invite_token === key
    return jsonOk(safeRow)
  }

  if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return jsonErr('Method not allowed', 405)
  }

  let body
  try { body = await req.json() } catch { return jsonErr('Invalid JSON') }

  const { tripId, token, patch } = body
  if (!tripId || !token) return jsonErr('tripId and token required')

  const v = await validateTripToken(tripId, token)
  if (!v.valid) return jsonErr('Unauthorized', 403)

  if (req.method === 'POST') {
    // Upsert full trip row (create or update)
    const { trip } = body
    if (!trip) return jsonErr('trip required')
    const row = { ...sanitizeTrip(trip), id: tripId, invite_token: token }
    const res = await fetch(`${base}/rest/v1/trips`, {
      method: 'POST',
      headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(row),
    })
    if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
    return jsonOk({ ok: true })
  }

  // DELETE — remove entire trip
  if (req.method === 'DELETE') {
    const res = await fetch(
      `${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}`,
      { method: 'DELETE', headers: adminHeaders() }
    )
    if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
    return jsonOk({ ok: true })
  }

  // PATCH — partial update (pessoas, plano, meta, title, etc.)
  if (!patch || typeof patch !== 'object') return jsonErr('patch required')
  // Only allow known safe columns; invite_token, id, owner_id, created_at are never patchable by clients
  const safePatch = sanitizeTrip(patch)

  const res = await fetch(
    `${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}`,
    {
      method: 'PATCH',
      headers: adminHeaders({ Prefer: 'return=minimal' }),
      body: JSON.stringify(safePatch),
    }
  )
  if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
  return jsonOk({ ok: true })
}
