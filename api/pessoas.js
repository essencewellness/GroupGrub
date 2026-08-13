import { validateTripToken, adminHeaders, jsonOk, jsonErr, supabaseUrl } from './_lib/adminClient.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return jsonErr('Method not allowed', 405)
  }

  let body
  try { body = await req.json() } catch { return jsonErr('Invalid JSON') }

  const { tripId, token, nome } = body
  if (!tripId || !token) return jsonErr('tripId and token required')
  if (!nome || typeof nome !== 'string' || !nome.trim()) return jsonErr('nome required')

  const v = await validateTripToken(tripId, token)
  if (!v.valid) return jsonErr('Unauthorized', 403)

  const base = supabaseUrl()

  if (req.method === 'POST') {
    // Unique constraint on (trip_id, nome) makes this atomic — two people
    // joining at nearly the same time can never drop each other's name.
    const res = await fetch(`${base}/rest/v1/pessoas`, {
      method: 'POST',
      headers: adminHeaders({ Prefer: 'resolution=ignore-duplicates,return=minimal' }),
      body: JSON.stringify({ trip_id: tripId, nome: nome.trim() }),
    })
    if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
    return jsonOk({ ok: true })
  }

  // DELETE
  const res = await fetch(
    `${base}/rest/v1/pessoas?trip_id=eq.${encodeURIComponent(tripId)}&nome=eq.${encodeURIComponent(nome)}`,
    { method: 'DELETE', headers: adminHeaders() }
  )
  if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
  return jsonOk({ ok: true })
}
