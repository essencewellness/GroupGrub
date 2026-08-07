/* global process */
export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { email } = await req.json()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ ok: false, error: 'Email inválido' }), { status: 400 })
    }
    if (email.length > 254) {
      return new Response(JSON.stringify({ ok: false, error: 'Email inválido' }), { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Supabase não configurado' }), { status: 500 })
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/customers?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    const rows = await res.json()
    const found = Array.isArray(rows) && rows.length > 0

    return new Response(JSON.stringify({ ok: found }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
