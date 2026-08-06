/* global process */
import Stripe from 'stripe'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { sessionId } = await req.json()
    if (!sessionId) return new Response(JSON.stringify({ ok: false }), { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      return new Response(JSON.stringify({ ok: true, email: session.customer_email }), { status: 200 })
    }
    return new Response(JSON.stringify({ ok: false }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
