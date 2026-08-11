/**
 * Calcula o número mínimo de transferências para acertar dívidas.
 * @param {Array} expenses - [{valor, pago_por, dividir_por: string[]}]
 * @param {string[]} pessoas - lista de nomes
 * @returns {{ settlements: [{de, para, valor}], saldos: {[nome]: number} }}
 */
export function calculateSettlement(expenses, pessoas) {
  // 1. Calcula saldo de cada pessoa (pago - quota)
  const saldos = {}
  for (const p of pessoas) saldos[p] = 0

  for (const exp of expenses) {
    const valor = parseFloat(exp.valor) || 0
    const divisores = exp.dividir_por?.length ? exp.dividir_por : pessoas
    const quota = divisores.length ? valor / divisores.length : 0

    // Include payer even if not in the pessoas list (e.g. owner on a guest's view)
    if (saldos[exp.pago_por] === undefined) saldos[exp.pago_por] = 0
    saldos[exp.pago_por] += valor

    for (const p of divisores) {
      if (saldos[p] === undefined) saldos[p] = 0
      saldos[p] -= quota
    }
  }

  // 2. Separa credores (saldo > 0) e devedores (saldo < 0)
  const credores = Object.entries(saldos).filter(([, v]) => v > 0.005).map(([nome, val]) => ({ nome, val }))
  const devedores = Object.entries(saldos).filter(([, v]) => v < -0.005).map(([nome, val]) => ({ nome, val: -val }))

  credores.sort((a, b) => b.val - a.val)
  devedores.sort((a, b) => b.val - a.val)

  // 3. Greedy matching
  const settlements = []
  let ci = 0, di = 0
  while (ci < credores.length && di < devedores.length) {
    const credor = credores[ci]
    const devedor = devedores[di]
    const amount = Math.min(credor.val, devedor.val)
    if (amount > 0.005) settlements.push({ de: devedor.nome, para: credor.nome, valor: amount })
    credor.val -= amount
    devedor.val -= amount
    if (credor.val < 0.005) ci++
    if (devedor.val < 0.005) di++
  }

  return { settlements, saldos }
}

export function formatSettlementWA(settlements) {
  if (!settlements.length) return '✅ Tudo acertado — sem transferências necessárias!'
  return settlements.map(s => `💸 ${s.de} → ${s.para}: ${s.valor.toFixed(2)}€`).join('\n')
}
