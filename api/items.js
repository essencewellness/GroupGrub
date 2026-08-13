import { validateTripToken, adminHeaders, jsonOk, jsonErr, supabaseUrl } from './_lib/adminClient.js'

export const config = { runtime: 'edge' }

const ALLOWED_ITEM_FIELDS = ['id', 'nome', 'qtd', 'categoria', 'comprado', 'antecipado', 'assignee']
function sanitizeItem(raw) {
  const out = {}
  for (const k of ALLOWED_ITEM_FIELDS) if (k in raw) out[k] = raw[k]
  return out
}

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
    const rows = body.items
      ? body.items.map(r => ({ ...sanitizeItem(r), trip_id: tripId }))
      : body.item
        ? [{ ...sanitizeItem(body.item), trip_id: tripId }]
        : null
    if (!rows) return jsonErr('item or items required')

    const res = await fetch(`${base}/rest/v1/items`, {
      method: 'POST',
      headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(rows),
    })
    if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
    return jsonOk({ ok: true })
  }

  // DELETE
  const itemId = body.id
  if (!itemId) return jsonErr('id required')
  const res = await fetch(
    `${base}/rest/v1/items?id=eq.${encodeURIComponent(itemId)}&trip_id=eq.${encodeURIComponent(tripId)}`,
    { method: 'DELETE', headers: adminHeaders() }
  )
  if (!res.ok) return jsonErr(`DB error ${res.status}`, 500)
  return jsonOk({ ok: true })
}
