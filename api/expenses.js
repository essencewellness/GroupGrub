/* global process */
import { validateTripToken, adminHeaders, jsonOk, jsonErr, supabaseUrl } from './_lib/adminClient.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return jsonErr('Method not allowed', 405)
  }

  let body
  try { body = await req.json() } catch { return jsonErr('Invalid JSON') }

  const { tripId, token } = body
  if (!tripId || !token) return jsonErr('tripId and token required')

  const v = await validateTripToken(tripId, token)
  if (!v.valid) return jsonErr('Unauthorized', 403)

  const base = supabaseUrl()

  if (req.method === 'POST') {
    const expense = body.expense
    if (!expense) return jsonErr('expense required')
    const row = { ...expense, trip_id: tripId }
    const res = await fetch(`${base}/rest/v1/expenses`, {
      method: 'POST',
      headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(row),
    })
    if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
    return jsonOk({ ok: true })
  }

  // DELETE
  const expenseId = body.id
  if (!expenseId) return jsonErr('id required')
  const res = await fetch(
    `${base}/rest/v1/expenses?id=eq.${encodeURIComponent(expenseId)}&trip_id=eq.${encodeURIComponent(tripId)}`,
    { method: 'DELETE', headers: adminHeaders() }
  )
  if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
  return jsonOk({ ok: true })
}
