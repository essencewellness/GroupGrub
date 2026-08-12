/* global process */
export const config = { runtime: 'edge' }

// Supabase-backed rate limiter (in-memory Maps reset per Edge isolate invocation)
async function isRateLimited(ip, supabaseUrl, supabaseKey, max = 10, windowSec = 60) {
  if (!supabaseUrl || !supabaseKey) return false
  try {
    const windowStart = new Date(Date.now() - windowSec * 1000).toISOString()
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/rate_limits?ip=eq.${encodeURIComponent(ip)}&hit_at=gte.${windowStart}&select=id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const hits = await countRes.json().catch(() => [])
    if (Array.isArray(hits) && hits.length >= max) return true
    fetch(`${supabaseUrl}/rest/v1/rate_limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ ip, hit_at: new Date().toISOString() }),
    }).catch(() => {})
    return false
  } catch { return false }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (await isRateLimited(ip, supabaseUrl, supabaseKey)) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), { status: 429 })
  }

  // Enforce body size limit (email + 6-digit token fits well under 512 bytes)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
  if (contentLength > 512) {
    return new Response(JSON.stringify({ ok: false, error: 'Payload too large' }), { status: 413 })
  }

  try {
    const { email, token } = await req.json()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const tokenRegex = /^\d{6}$/

    if (!email || !emailRegex.test(email.trim()) || !token || !tokenRegex.test(token.trim())) {
      return new Response(JSON.stringify({ ok: false, error: 'Dados inválidos' }), { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Serviço indisponível' }), { status: 500 })
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(normalizedEmail)}&select=id,recovery_token,recovery_expires_at`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const rows = await res.json().catch(() => [])

    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ ok: false }), { status: 200 })
    }

    const customer = rows[0]
    const now = Date.now()
    const expires = customer.recovery_expires_at ? new Date(customer.recovery_expires_at).getTime() : 0

    if (
      customer.recovery_token !== token.trim() ||
      expires < now
    ) {
      return new Response(JSON.stringify({ ok: false, error: 'Código inválido ou expirado' }), { status: 200 })
    }

    // Valid — clear the token so it can't be reused
    await fetch(
      `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(normalizedEmail)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ recovery_token: null, recovery_expires_at: null }),
      }
    ).catch(() => {})

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('verify-recovery error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { status: 500 })
  }
}
