/* global process */
import Stripe from 'stripe'

export const config = { runtime: 'edge' }

const ALLOWED_ORIGINS = [
  'https://ferias-app-pi.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

function corsHeaders(req) {
  const origin = req.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return { 'Access-Control-Allow-Origin': allowed, 'Content-Type': 'application/json' }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders(req) })
  }

  try {
    const { tripId: rawTripId, customerEmail } = await req.json()
    // C-14: validate tripId to prevent injection in success_url
    const tripId = typeof rawTripId === 'string' ? rawTripId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) : ''
    if (!tripId) return new Response(JSON.stringify({ error: 'Invalid tripId' }), { status: 400, headers: corsHeaders(req) })
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = ALLOWED_ORIGINS[0]

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}?trip=${tripId}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?trip=${tripId}`,
      metadata: { tripId, type: 'lifetime_access' },
    })

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: corsHeaders(req) })
  } catch (err) {
    console.error('Stripe Checkout Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders(req) })
  }
}
