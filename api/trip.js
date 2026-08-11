/* global process */
import { validateTripToken, adminHeaders, jsonOk, jsonErr, supabaseUrl } from './_lib/adminClient.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const base = supabaseUrl()

  // GET /api/trip?tripId=X — public read (no token needed, RLS SELECT is open)
  if (req.method === 'GET') {
    const tripId = new URL(req.url).searchParams.get('tripId')
    if (!tripId) return jsonErr('tripId required')
    const res = await fetch(
      `${base}/rest/v1/trips?id=eq.${encodeURIComponent(tripId)}&select=*`,
      { headers: adminHeaders() }
    )
    const rows = await res.json().catch(() => [])
    return jsonOk(Array.isArray(rows) ? rows[0] ?? null : null)
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
    const row = { ...trip, id: tripId, invite_token: token }
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
  // Never allow overwriting invite_token via patch (only bootstrapped internally)
  const safePatch = { ...patch }
  delete safePatch.invite_token

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
