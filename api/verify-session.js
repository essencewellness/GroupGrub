/* global process */
import Stripe from 'stripe'

export const config = { runtime: 'edge' }

// C-4: Supabase-backed rate limiter (replaces in-memory Map that doesn't persist across Edge invocations)
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
    // Record this hit (fire-and-forget)
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

  // Body size limit (Stripe session IDs are ~66 chars; 512 bytes is ample)
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10)
  if (contentLength > 512) {
    return new Response(JSON.stringify({ ok: false, error: 'Payload too large' }), { status: 413 })
  }

  try {
    const { sessionId } = await req.json()
    // Stripe session IDs are alphanumeric + underscores, prefixed cs_
    if (!sessionId || typeof sessionId !== 'string' || !/^cs_[a-zA-Z0-9_]{10,200}$/.test(sessionId)) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid sessionId' }), { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const email = session.customer_email

      // C-3: check if this session was already verified (replay attack prevention)
      if (supabaseUrl && supabaseKey) {
        const existing = await fetch(
          `${supabaseUrl}/rest/v1/customers?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=email,verified_at`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        ).then(r => r.json()).catch(() => [])
        if (Array.isArray(existing) && existing.length > 0 && existing[0].verified_at) {
          // Already verified — return ok but don't grant again
          // Use the stored email from DB; fall back to Stripe session email if missing
          return new Response(JSON.stringify({ ok: true, email: existing[0].email ?? email, replayed: true }), { status: 200 })
        }
      }

      // Persist email → Supabase for cross-device recovery, with verified_at timestamp
      if (email && supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            stripe_session_id: sessionId,
            verified_at: new Date().toISOString(),
          }),
        }).catch(() => { /* non-fatal */ })
      }
      return new Response(JSON.stringify({ ok: true, email }), { status: 200 })
    }
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  } catch (err) {
    console.error('verify-session error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error' }), { status: 500 })
  }
}
