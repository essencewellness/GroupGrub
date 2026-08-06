/* global process */
import Stripe from 'stripe'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { tripId, customerEmail } = await req.json()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const origin = req.headers.get('origin') || 'https://ferias-app-pi.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}?trip=${tripId}&paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?trip=${tripId}`,
      metadata: { tripId, type: 'lifetime_access' },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Stripe Checkout Error:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
