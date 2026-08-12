/* global process */
export const config = { runtime: 'edge' }

// Supabase-backed rate limiter — persists across Edge isolates (in-memory Maps reset per invocation)
async function isRateLimited(ip, supabaseUrl, supabaseKey, max = 5, windowSec = 60) {
  if (!supabaseUrl || !supabaseKey) return false
  try {
    const windowStart = new Date(Date.now() - windowSec * 1000).toISOString()
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/rate_limits?ip=eq.${encodeURIComponent(ip)}&hit_at=gte.${windowStart}&select=id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const hits = await countRes.json().catch(() => [])
    if (Array.isArray(hits) && hits.length >= max) return true
    // Record this hit (fire-and-forget)
    fetch(`${supabaseUrl}/rest/v1/rate_limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      body: JSON.stringify({ ip, hit_at: new Date().toISOString() }),
    }).catch(() => {})
    return false
  } catch { return false }
}

// Bias-free 6-digit OTP: sample bytes until we get a value in the unbiased range
function generateToken() {
  const limit = 1_000_000
  const cap = Math.floor(0x100000000 / limit) * limit // largest multiple of 1e6 fitting in uint32
  const buf = new Uint32Array(1)
  do { crypto.getRandomValues(buf) } while (buf[0] >= cap)
  return String(buf[0] % limit).padStart(6, '0')
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

  // Enforce a request body size limit (1 KB is more than enough for an email)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
  if (contentLength > 1024) {
    return new Response(JSON.stringify({ ok: false, error: 'Payload too large' }), { status: 413 })
  }

  try {
    const { email } = await req.json()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim()) || email.length > 254) {
      return new Response(JSON.stringify({ ok: false, error: 'Email inválido' }), { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const resendKey = process.env.RESEND_API_KEY

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Serviço indisponível' }), { status: 503 })
    }

    // A-8 fix: always respond the same way — never reveal if email exists
    // Check if email exists, generate token, send email — all silently
    const customerRes = await fetch(
      `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(normalizedEmail)}&select=id`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const customers = await customerRes.json().catch(() => [])
    const found = Array.isArray(customers) && customers.length > 0

    if (found && resendKey) {
      const token = generateToken()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      // Store token in Supabase
      await fetch(`${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(normalizedEmail)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ recovery_token: token, recovery_expires_at: expiresAt }),
      }).catch(() => {})

      // Send email via Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GroupGrub <onboarding@resend.dev>',
          to: normalizedEmail,
          subject: `${token} — Código de recuperação GroupGrub`,
          html: `
            <div style="background:#0a0a0b;color:#f5f5f4;font-family:monospace;padding:40px 24px;max-width:480px;margin:0 auto;border-radius:16px">
              <div style="font-size:32px;text-align:center;margin-bottom:24px">🛰️</div>
              <h1 style="font-size:22px;font-weight:700;text-align:center;margin:0 0 8px;letter-spacing:-0.02em">
                GROUP<span style="color:#ff5a26">GRUB</span>
              </h1>
              <p style="color:#888;font-size:13px;text-align:center;margin:0 0 32px">Recuperação de acesso</p>
              <div style="background:#141416;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                <div style="color:#888;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px">O teu código</div>
                <div style="font-size:42px;font-weight:700;letter-spacing:0.18em;color:#fff">${token}</div>
                <div style="color:#555;font-size:11px;margin-top:12px">Expira em 15 minutos</div>
              </div>
              <p style="color:#555;font-size:12px;text-align:center;margin:0">
                Se não pediste este código, ignora este email.
              </p>
            </div>
          `,
        }),
      }).catch(() => {})
    }

    // Always return same response — never reveal if email exists (A-8)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('recover error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { status: 500 })
  }
}
