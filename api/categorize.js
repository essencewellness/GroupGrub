export const config = { runtime: 'edge' }

const CATS = ['dispensa', 'bebidas', 'talho', 'laticinios', 'fresco', 'outro']

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const groqKey = process.env.VITE_GROQ_KEY || process.env.GROQ_KEY
  if (!groqKey) return new Response(JSON.stringify({ error: 'no groq key' }), { status: 500 })

  let body
  try { body = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }

  const { items } = body // [{ id, nome }]
  if (!Array.isArray(items) || !items.length) {
    return new Response(JSON.stringify({ results: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const prompt = `Categoriza cada item de lista de compras numa das seguintes categorias:
- dispensa: arroz, massa, azeite, enlatados, condimentos, papel, produtos de limpeza, snacks
- bebidas: água, sumos, vinho, cerveja, refrigerantes, spirits
- talho: carne fresca, peixe fresco, marisco, aves, charcutaria
- laticinios: leite, queijo, iogurte, manteiga, natas, ovos
- fresco: fruta, legumes, verduras, ervas frescas
- outro: tudo o resto

Responde APENAS com JSON válido, sem texto adicional:
{ "results": [ { "id": "...", "categoria": "..." } ] }

Items:
${items.map(i => `{ "id": "${i.id}", "nome": "${i.nome}" }`).join('\n')}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 512,
      }),
    })

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim() || ''
    const parsed = JSON.parse(text)
    const validResults = (parsed.results || []).filter(r => CATS.includes(r.categoria))

    return new Response(JSON.stringify({ results: validResults }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'groq failed' }), { status: 500 })
  }
}
