/* global process */
import Stripe from 'stripe'

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { priceId, tripId, customerEmail, email } = await req.json()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // 👈 Alinhado para Pagamento Único (Lifetime)
      customer_email: customerEmail || email || undefined,
      line_items: [
        {
          price: priceId || process.env.VITE_STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin') || 'https://groupgrub.app'}?session_id={CHECKOUT_SESSION_SECRET}&tripId=${tripId}&status=success`,
      cancel_url: `${req.headers.get('origin') || 'https://groupgrub.app'}?status=cancelled`,
      metadata: {
        tripId,
        type: 'lifetime_access',
      },
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
