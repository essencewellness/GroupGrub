/* global process */
import Stripe from 'stripe'

export const config = { runtime: 'edge' }

const _hits = new Map()
function isRateLimited(ip, max = 10, windowMs = 60_000) {
  const now = Date.now()
  const recent = (_hits.get(ip) || []).filter(t => now - t < windowMs)
  if (recent.length >= max) return true
  recent.push(now)
  _hits.set(ip, recent)
  return false
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many requests' }), { status: 429 })
  }

  try {
    const { sessionId } = await req.json()
    if (!sessionId) return new Response(JSON.stringify({ ok: false }), { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      const email = session.customer_email
      // Persist email → Supabase for cross-device recovery
      if (email) {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && supabaseKey) {
          await fetch(`${supabaseUrl}/rest/v1/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Prefer: 'resolution=ignore-duplicates',
            },
            body: JSON.stringify({ email: email.trim().toLowerCase(), stripe_session_id: sessionId }),
          }).catch(() => { /* non-fatal */ })
        }
      }
      return new Response(JSON.stringify({ ok: true, email }), { status: 200 })
    }
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
